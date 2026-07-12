import json
import httpx
from typing import Dict, Any, List, Tuple
from google import genai
from google.genai import types

from .config import (
    GEMINI_API_KEY,
    FIREWORKS_API_KEY,
    FIREWORKS_BASE_URL,
    LOCAL_PROVIDER,
    LOCAL_MODEL,
    DEFAULT_MAX_TOKENS,
    DEFAULT_TEMPERATURE,
)

class LocalEngine:
    """
    The Local Tier — Fast, cheap draft generation.
    
    Hackathon Compute Usage: 
    When LOCAL_PROVIDER is set to 'fireworks', this engine routes requests to Fireworks AI,
    which executes the local model (e.g., gemma2-9b-it) on AMD Instinct™ MI300X accelerators.
    This provides blazing-fast token generation for the first pass of our pipeline.
    """

    def __init__(self):
        self.model = LOCAL_MODEL
        self.provider = LOCAL_PROVIDER
        
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

    def build_system_prompt(self, pack: Dict[str, Any]) -> str:
        """Build a system prompt from the pack's persona and rules."""
        persona = pack.get("persona", {})
        rules = pack.get("rules", [])
        languages = pack.get("languages", ["en"])
        parts = []

        parts.append(f"You are '{pack.get('name', 'GuildHouse Clerk')}' — {pack.get('description', 'a specialized AI assistant')}.")

        if persona:
            voice = persona.get("voice", "")
            stance = persona.get("stance", "")
            if voice:
                parts.append(f"Voice: {voice}")
            if stance:
                parts.append(f"Stance: {stance}")

        if rules:
            rules_text = "\n".join(f"  - {r}" for r in rules)
            parts.append(f"You MUST follow these rules:\n{rules_text}")

        escalation = pack.get("escalation_policy", {})
        forbidden = escalation.get("forbidden", [])
        if forbidden:
            parts.append(f"FORBIDDEN topics (refuse to answer): {', '.join(forbidden)}")

        redact = escalation.get("redact_first", [])
        if redact:
            parts.append(f"Redact before processing: {', '.join(redact)}")

        if languages:
            parts.append(f"Supported languages: {', '.join(languages)}. Respond in the language the user uses.")

        tools = pack.get("tools", [])
        if tools:
            parts.append(f"You have access to these tools: {', '.join(tools)}. Reference them when relevant.")

        return "\n\n".join(parts)

    async def _generate_gemini(self, prompt: str, system_instruction: str, history: List[Dict[str, str]]) -> Tuple[str, int]:
        if not self.gemini_client:
            return "[Mock — No Gemini API Key] I am the Clerk.", 0
            
        messages = []
        if history:
            for turn in history[-6:]:
                messages.append(types.Content(role="user", parts=[types.Part.from_text(text=turn["user"])]))
                messages.append(types.Content(role="model", parts=[types.Part.from_text(text=turn["assistant"])]))

        messages.append(types.Content(role="user", parts=[types.Part.from_text(text=prompt)]))
        
        config_kwargs = {
            "max_output_tokens": DEFAULT_MAX_TOKENS,
            "temperature": DEFAULT_TEMPERATURE,
        }
        if system_instruction:
            config_kwargs["system_instruction"] = system_instruction
            
        config = types.GenerateContentConfig(**config_kwargs)

        try:
            response = await self.gemini_client.aio.models.generate_content(
                model=self.model,
                contents=messages,
                config=config,
            )
            answer = response.text
            prompt_tokens = response.usage_metadata.prompt_token_count if response.usage_metadata else 0
            return answer, prompt_tokens
        except Exception as e:
            return f"[Gemini Engine Error] {type(e).__name__}: {str(e)}", 0

    async def _generate_fireworks(self, prompt: str, system_instruction: str, history: List[Dict[str, str]]) -> Tuple[str, int]:
        if not self.fireworks_client:
            return "[Mock — No Fireworks API Key] I am the Clerk.", 0
            
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})

        if history:
            for turn in history[-6:]:
                messages.append({"role": "user", "content": turn["user"]})
                messages.append({"role": "assistant", "content": turn["assistant"]})

        messages.append({"role": "user", "content": prompt})

        try:
            response = await self.fireworks_client.post(
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
            return answer, prompt_tokens
        except Exception as e:
            return f"[Fireworks Engine Error] {type(e).__name__}: {str(e)}", 0

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
        system_instruction = self.build_system_prompt(pack) if pack else None
        
        if self.provider == "gemini":
            return await self._generate_gemini(prompt, system_instruction, history)
        else:
            return await self._generate_fireworks(prompt, system_instruction, history)

    async def close(self):
        if self.fireworks_client:
            await self.fireworks_client.aclose()


# Singleton instance
local_engine = LocalEngine()
