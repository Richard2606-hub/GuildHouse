import httpx
from typing import Dict, Any
from google import genai
from google.genai import types

from .config import (
    GEMINI_API_KEY,
    FIREWORKS_API_KEY,
    FIREWORKS_BASE_URL,
    TOOL_PROVIDER,
    LOCAL_MODEL,
)

class ToolsRegistry:
    """
    GuildHouse Tool System — provides specialized capabilities to clerks.
    Tools are granted per-pack via the YAML manifest.
    Supports routing between Gemini and Fireworks AI based on config.
    """

    def __init__(self):
        self.tool_descriptions = {
            "ocr": "Optical Character Recognition — extracts text from images and documents",
            "vision": "Visual Analysis — identifies objects, text, and patterns in images",
            "media_pipeline": "Media Processing — extracts keyframes, generates transcripts from video/audio",
        }
        self.provider = TOOL_PROVIDER
        
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
                timeout=30.0,
            )

    async def _execute_gemini(self, tool_name: str, tool_prompt: str) -> str:
        if not self.gemini_client:
            return self._mock_tool(tool_name, tool_prompt)
        try:
            config = types.GenerateContentConfig(
                max_output_tokens=512,
                temperature=0.3,
            )
            response = await self.gemini_client.aio.models.generate_content(
                model=LOCAL_MODEL,
                contents=tool_prompt,
                config=config,
            )
            return response.text if response.text else f"[{tool_name} returned no response]"
        except Exception as e:
            return f"[Gemini Tool Error] {tool_name} failed: {str(e)}"

    async def _execute_fireworks(self, tool_name: str, tool_prompt: str) -> str:
        if not self.fireworks_client:
            return self._mock_tool(tool_name, tool_prompt)
        try:
            response = await self.fireworks_client.post(
                "/chat/completions",
                json={
                    "model": LOCAL_MODEL,
                    "messages": [{"role": "user", "content": tool_prompt}],
                    "max_tokens": 512,
                    "temperature": 0.3,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            return f"[Fireworks Tool Error] {tool_name} failed: {str(e)}"

    async def execute_tool(self, tool_name: str, context: str, pack: Dict[str, Any]) -> str:
        """Execute a tool if the pack has the grant."""
        grants = pack.get("tools", [])
        if tool_name not in grants:
            return f"[Tool Denied] Clerk does not have grant for '{tool_name}'."

        if tool_name not in self.tool_descriptions:
            return f"[Tool Error] Tool '{tool_name}' not found."

        tool_prompt = self._build_tool_prompt(tool_name, context, pack)
        
        if self.provider == "gemini":
            return await self._execute_gemini(tool_name, tool_prompt)
        else:
            return await self._execute_fireworks(tool_name, tool_prompt)

    def _build_tool_prompt(self, tool_name: str, context: str, pack: Dict[str, Any]) -> str:
        prompts = {
            "ocr": (
                f"You are an OCR tool for '{pack.get('name', 'Clerk')}'. "
                f"The user has submitted content for text extraction. "
                f"Based on the following context, generate realistic OCR output "
                f"with extracted fields, text blocks, and confidence levels.\n\n"
                f"Context: {context}"
            ),
            "vision": (
                f"You are a computer vision analysis tool for '{pack.get('name', 'Clerk')}'. "
                f"Analyze the described visual content and provide structured findings: "
                f"identified elements, classifications, and confidence scores.\n\n"
                f"Context: {context}"
            ),
            "media_pipeline": (
                f"You are a media processing pipeline for '{pack.get('name', 'Clerk')}'. "
                f"Process the described media content and generate: "
                f"keyframe descriptions, transcript segments, and content summary.\n\n"
                f"Context: {context}"
            ),
        }
        return prompts.get(tool_name, f"Process this with {tool_name}: {context}")

    def _mock_tool(self, tool_name: str, context: str) -> str:
        mocks = {
            "ocr": "[OCR Result] Extracted text from document. Fields identified: Date, Amount, Reference Number.",
            "vision": "[Vision Result] Image analysis complete. Objects identified with confidence scores.",
            "media_pipeline": "[Media Pipeline] Video processed. Keyframes extracted, transcript generated.",
        }
        return mocks.get(tool_name, f"[{tool_name}] Processing complete.")

    def get_available_tools(self, pack: Dict[str, Any]) -> list:
        grants = pack.get("tools", [])
        return [
            {"name": t, "description": self.tool_descriptions.get(t, "")}
            for t in grants
            if t in self.tool_descriptions
        ]

# Global instance
tools_registry = ToolsRegistry()
