import httpx
import json
from typing import Dict, Any, List, Tuple

from .config import (
    FIREWORKS_API_KEY,
    FIREWORKS_BASE_URL,
    LOCAL_MODEL,
    DEFAULT_MAX_TOKENS,
    DEFAULT_TEMPERATURE,
)


class LocalEngine:
    """
    The 'resident clerk brain' — uses a smaller, cheaper model via Fireworks AI.
    In production with AMD GPU credits, this would run locally via llama-cpp-python + ROCm.
    The architecture is the same either way: generate a draft, return with confidence.
    """

    def __init__(self):
        self.model = LOCAL_MODEL
        self.client = httpx.AsyncClient(
            base_url=FIREWORKS_BASE_URL,
            headers={
                "Authorization": f"Bearer {FIREWORKS_API_KEY}",
                "Content-Type": "application/json",
            },
            timeout=60.0,
        )

    def build_system_prompt(self, pack: Dict[str, Any]) -> str:
        """Build a system prompt from the pack's persona and rules."""
        persona = pack.get("persona", {})
        rules = pack.get("rules", [])
        languages = pack.get("languages", ["en"])

        parts = []

        # Identity
        parts.append(f"You are '{pack.get('name', 'GuildHouse Clerk')}' — {pack.get('description', 'a specialized AI assistant')}.")

        # Voice & Stance
        if persona:
            voice = persona.get("voice", "")
            stance = persona.get("stance", "")
            if voice:
                parts.append(f"Voice: {voice}")
            if stance:
                parts.append(f"Stance: {stance}")

        # Rules
        if rules:
            rules_text = "\n".join(f"  - {r}" for r in rules)
            parts.append(f"You MUST follow these rules:\n{rules_text}")

        # Escalation policy
        escalation = pack.get("escalation_policy", {})
        forbidden = escalation.get("forbidden", [])
        if forbidden:
            parts.append(f"FORBIDDEN topics (refuse to answer): {', '.join(forbidden)}")

        redact = escalation.get("redact_first", [])
        if redact:
            parts.append(f"Redact before processing: {', '.join(redact)}")

        # Languages
        if languages:
            parts.append(f"Supported languages: {', '.join(languages)}. Respond in the language the user uses.")

        # Tool awareness
        tools = pack.get("tools", [])
        if tools:
            parts.append(f"You have access to these tools: {', '.join(tools)}. Reference them when relevant.")

        return "\n\n".join(parts)

    async def generate(
        self,
        prompt: str,
        pack: Dict[str, Any] = None,
        history: List[Dict[str, str]] = None,
    ) -> Tuple[str, int]:
        """
        Generate a response using the local-tier (cheap) model.
        Returns (response_text, prompt_tokens_used).
        """
        if not FIREWORKS_API_KEY:
            # Fallback mock for development without API key
            return (
                f"[Mock — No API Key] I am '{pack.get('name', 'Clerk')}'. "
                f"I received your message: '{prompt[:80]}...'",
                0,
            )

        messages = []

        # System prompt from pack
        if pack:
            messages.append({"role": "system", "content": self.build_system_prompt(pack)})

        # Conversation history
        if history:
            for turn in history[-6:]:  # Keep last 6 turns to manage context window
                messages.append({"role": "user", "content": turn["user"]})
                messages.append({"role": "assistant", "content": turn["assistant"]})

        # Current user message
        messages.append({"role": "user", "content": prompt})

        try:
            response = await self.client.post(
                "/chat/completions",
                json={
                    "model": self.model,
                    "messages": messages,
                    "max_tokens": DEFAULT_MAX_TOKENS,
                    "temperature": DEFAULT_TEMPERATURE,
                },
            )
            response.raise_for_status()
            data = response.json()

            answer = data["choices"][0]["message"]["content"]
            prompt_tokens = data.get("usage", {}).get("prompt_tokens", 0)
            completion_tokens = data.get("usage", {}).get("completion_tokens", 0)
            total_tokens = prompt_tokens + completion_tokens

            return answer, total_tokens

        except httpx.HTTPStatusError as e:
            error_detail = e.response.text if e.response else str(e)
            return f"[Local Engine Error] API returned {e.response.status_code}: {error_detail}", 0
        except Exception as e:
            return f"[Local Engine Error] {type(e).__name__}: {str(e)}", 0

    async def close(self):
        await self.client.aclose()


# Singleton instance
local_engine = LocalEngine()
