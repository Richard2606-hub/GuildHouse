import httpx
import re
from typing import Tuple
from google import genai
from google.genai import types

from .config import (
    GEMINI_API_KEY,
    FIREWORKS_API_KEY,
    FIREWORKS_BASE_URL,
    ESCALATION_PROVIDER,
    JUDGE_PROVIDER,
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
    
    Hackathon Compute Usage:
    The gateway acts as the orchestrator for provider routing. When using Fireworks AI
    for the JUDGE_PROVIDER or ESCALATION_PROVIDER, it relies on AMD Instinct™ accelerators 
    to quickly score the response or generate high-quality fallback answers.
    """

    def __init__(self):
        self.escalation_model = ESCALATION_MODEL
        self.judge_model = JUDGE_MODEL
        self.threshold = ESCALATION_THRESHOLD
        
        self.escalation_provider = ESCALATION_PROVIDER
        self.judge_provider = JUDGE_PROVIDER

        self.gemini_client = None
        if GEMINI_API_KEY:
            self.gemini_client = genai.Client(api_key=GEMINI_API_KEY)
            
        self.fireworks_client = None
        if FIREWORKS_API_KEY:
            self.fireworks_client = httpx.AsyncClient(
                base_url=FIREWORKS_BASE_URL,
                headers={
                    "Authorization": f"Bearer {FIREWORKS_API_KEY}",
                    "Content-Type": "application/json",
                },
                timeout=60.0,
            )

    async def _assess_confidence_gemini(self, judge_prompt: str) -> float:
        if not self.gemini_client:
            return 0.85
        try:
            config = types.GenerateContentConfig(
                max_output_tokens=JUDGE_MAX_TOKENS,
                temperature=JUDGE_TEMPERATURE,
            )
            response = await self.gemini_client.aio.models.generate_content(
                model=self.judge_model,
                contents=judge_prompt,
                config=config,
            )
            raw = response.text.strip() if response.text else ""
            match = re.search(r"(\d+\.?\d*)", raw)
            if match:
                score = float(match.group(1))
                return min(max(score, 0.0), 1.0)
            return 0.5
        except Exception as e:
            print(f"[Gateway/Gemini] Confidence assessment failed: {e}")
            return 0.5

    async def _assess_confidence_fireworks(self, judge_prompt: str) -> float:
        if not self.fireworks_client:
            return 0.85
        try:
            response = await self.fireworks_client.post(
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
            match = re.search(r"(\d+\.?\d*)", raw)
            if match:
                score = float(match.group(1))
                return min(max(score, 0.0), 1.0)
            return 0.5
        except Exception as e:
            print(f"[Gateway/Fireworks] Confidence assessment failed: {e}")
            return 0.5

    async def assess_confidence(self, user_prompt: str, draft: str) -> float:
        judge_prompt = (
            "You are a quality judge. Rate how well the following ANSWER addresses the USER QUESTION.\n"
            "Consider: accuracy, completeness, helpfulness, and whether the answer stays in character.\n"
            "Respond with ONLY a number between 0.0 and 1.0 (e.g., 0.85). Nothing else.\n\n"
            f"USER QUESTION: {user_prompt}\n\n"
            f"ANSWER: {draft}"
        )
        if self.judge_provider == "gemini":
            return await self._assess_confidence_gemini(judge_prompt)
        else:
            return await self._assess_confidence_fireworks(judge_prompt)

    async def _call_escalation_gemini(self, system_prompt: str, user_prompt: str, history: list = None) -> Tuple[str, int]:
        if not self.gemini_client:
            return "[Mock Escalation — Gemini] I am the expert model, called in to help.", 0

        messages = []
        if history:
            for turn in history[-6:]:
                messages.append(types.Content(role="user", parts=[types.Part.from_text(text=turn["user"])]))
                messages.append(types.Content(role="model", parts=[types.Part.from_text(text=turn["assistant"])]))

        messages.append(types.Content(role="user", parts=[types.Part.from_text(text=user_prompt)]))

        config_kwargs = {
            "max_output_tokens": DEFAULT_MAX_TOKENS,
            "temperature": DEFAULT_TEMPERATURE,
        }
        if system_prompt:
            config_kwargs["system_instruction"] = system_prompt
            
        config = types.GenerateContentConfig(**config_kwargs)

        try:
            response = await self.gemini_client.aio.models.generate_content(
                model=self.escalation_model,
                contents=messages,
                config=config,
            )
            answer = response.text
            total_tokens = response.usage_metadata.total_token_count if response.usage_metadata else 0
            return answer, total_tokens
        except Exception as e:
            return f"[Gemini Escalation Error] {type(e).__name__}: {str(e)}", 0

    async def _call_escalation_fireworks(self, system_prompt: str, user_prompt: str, history: list = None) -> Tuple[str, int]:
        if not self.fireworks_client:
            return "[Mock Escalation — Fireworks] I am the expert model, called in to help.", 0

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        if history:
            for turn in history[-6:]:
                messages.append({"role": "user", "content": turn["user"]})
                messages.append({"role": "assistant", "content": turn["assistant"]})

        messages.append({"role": "user", "content": user_prompt})

        try:
            response = await self.fireworks_client.post(
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
        except Exception as e:
            return f"[Fireworks Escalation Error] {type(e).__name__}: {str(e)}", 0

    async def call_escalation_model(self, system_prompt: str, user_prompt: str, history: list = None) -> Tuple[str, int]:
        if self.escalation_provider == "gemini":
            return await self._call_escalation_gemini(system_prompt, user_prompt, history)
        else:
            return await self._call_escalation_fireworks(system_prompt, user_prompt, history)

    async def gate_request(
        self,
        local_draft: str,
        user_prompt: str,
        system_prompt: str = "",
        history: list = None,
    ) -> Tuple[str, bool, float, int]:
        confidence = await self.assess_confidence(user_prompt, local_draft)

        if confidence >= self.threshold:
            return local_draft, False, confidence, 0

        print(f"[Gateway] Confidence {confidence:.2f} < threshold {self.threshold}. Escalating...")
        escalated_answer, escalation_tokens = await self.call_escalation_model(
            system_prompt, user_prompt, history
        )
        return escalated_answer, True, confidence, escalation_tokens

    async def close(self):
        if self.fireworks_client:
            await self.fireworks_client.aclose()


# Singleton instance
gateway = EscalationGateway()
