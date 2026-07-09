import httpx
import json
import re
from typing import Tuple

from .config import (
    FIREWORKS_API_KEY,
    FIREWORKS_BASE_URL,
    ESCALATION_MODEL,
    JUDGE_MODEL,
    ESCALATION_THRESHOLD,
    DEFAULT_MAX_TOKENS,
    DEFAULT_TEMPERATURE,
    JUDGE_MAX_TOKENS,
    JUDGE_TEMPERATURE,
)


class EscalationGateway:
    """
    The Confidence Gate — routes between cheap local-tier and expensive escalation-tier.
    
    Flow:
    1. Receive the local model's draft
    2. Ask a judge model to assess confidence (0.0 - 1.0)
    3. If confidence < threshold, re-generate with the escalation model
    4. Log token costs for the ledger
    """

    def __init__(self):
        self.escalation_model = ESCALATION_MODEL
        self.judge_model = JUDGE_MODEL
        self.threshold = ESCALATION_THRESHOLD
        self.client = httpx.AsyncClient(
            base_url=FIREWORKS_BASE_URL,
            headers={
                "Authorization": f"Bearer {FIREWORKS_API_KEY}",
                "Content-Type": "application/json",
            },
            timeout=60.0,
        )

    async def assess_confidence(self, user_prompt: str, draft: str) -> float:
        """
        Ask a small model to rate how well the draft answers the prompt.
        Returns a float 0.0–1.0.
        """
        if not FIREWORKS_API_KEY:
            return 0.85  # Mock confidence

        judge_prompt = (
            "You are a quality judge. Rate how well the following ANSWER addresses the USER QUESTION.\n"
            "Consider: accuracy, completeness, helpfulness, and whether the answer stays in character.\n"
            "Respond with ONLY a number between 0.0 and 1.0 (e.g., 0.85). Nothing else.\n\n"
            f"USER QUESTION: {user_prompt}\n\n"
            f"ANSWER: {draft}"
        )

        try:
            response = await self.client.post(
                "/chat/completions",
                json={
                    "model": self.judge_model,
                    "messages": [{"role": "user", "content": judge_prompt}],
                    "max_tokens": JUDGE_MAX_TOKENS,
                    "temperature": JUDGE_TEMPERATURE,
                },
            )
            response.raise_for_status()
            data = response.json()
            raw = data["choices"][0]["message"]["content"].strip()

            # Extract float from response
            match = re.search(r"(\d+\.?\d*)", raw)
            if match:
                score = float(match.group(1))
                return min(max(score, 0.0), 1.0)  # Clamp to [0, 1]
            return 0.5  # Default if parsing fails

        except Exception as e:
            print(f"[Gateway] Confidence assessment failed: {e}")
            return 0.5  # Conservative default — will likely trigger escalation

    async def call_escalation_model(self, system_prompt: str, user_prompt: str, history: list = None) -> Tuple[str, int]:
        """Call the larger escalation model for a higher-quality response."""
        if not FIREWORKS_API_KEY:
            return "[Mock Escalation] I am the expert model, called in to help.", 0

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        if history:
            for turn in history[-6:]:
                messages.append({"role": "user", "content": turn["user"]})
                messages.append({"role": "assistant", "content": turn["assistant"]})

        messages.append({"role": "user", "content": user_prompt})

        try:
            response = await self.client.post(
                "/chat/completions",
                json={
                    "model": self.escalation_model,
                    "messages": messages,
                    "max_tokens": DEFAULT_MAX_TOKENS,
                    "temperature": DEFAULT_TEMPERATURE,
                },
            )
            response.raise_for_status()
            data = response.json()

            answer = data["choices"][0]["message"]["content"]
            total_tokens = data.get("usage", {}).get("total_tokens", 0)
            return answer, total_tokens

        except httpx.HTTPStatusError as e:
            error_detail = e.response.text if e.response else str(e)
            return f"[Escalation Error] API returned {e.response.status_code}: {error_detail}", 0
        except Exception as e:
            return f"[Escalation Error] {type(e).__name__}: {str(e)}", 0

    async def gate_request(
        self,
        local_draft: str,
        user_prompt: str,
        system_prompt: str = "",
        history: list = None,
    ) -> Tuple[str, bool, float, int]:
        """
        The Confidence Gate.
        
        Returns: (final_answer, was_escalated, confidence_score, escalation_tokens)
        """
        confidence = await self.assess_confidence(user_prompt, local_draft)

        if confidence >= self.threshold:
            return local_draft, False, confidence, 0

        print(f"[Gateway] Confidence {confidence:.2f} < threshold {self.threshold}. Escalating...")
        escalated_answer, escalation_tokens = await self.call_escalation_model(
            system_prompt, user_prompt, history
        )
        return escalated_answer, True, confidence, escalation_tokens

    async def close(self):
        await self.client.aclose()


# Singleton instance
gateway = EscalationGateway()
