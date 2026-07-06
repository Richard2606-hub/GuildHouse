from typing import Dict, Any, List

class ToolsRegistry:
    def __init__(self):
        self.available_tools = {
            "ocr": self._mock_ocr,
            "vision": self._mock_vision,
            "media_pipeline": self._mock_media_pipeline
        }

    async def execute_tool(self, tool_name: str, payload: Any, pack: Dict[str, Any]) -> str:
        """Execute a tool if the pack has the grant."""
        grants = pack.get("tools", [])
        if tool_name not in grants:
            return f"[Tool Error] Access Denied: Clerk does not have grant for '{tool_name}'."
        
        if tool_name not in self.available_tools:
            return f"[Tool Error] Tool '{tool_name}' not found on house hardware."

        return await self.available_tools[tool_name](payload)

    async def _mock_ocr(self, payload):
        return "[OCR Result] Extracted text: 'Urgent: Your parcel is delayed. Click here to pay customs fee.'"

    async def _mock_vision(self, payload):
        return "[Vision Result] Identified elements: Receipt from Store X, Total: $45.00."

    async def _mock_media_pipeline(self, payload):
        return "[Media Pipeline] Keyframes extracted. Transcript generated: 'Welcome to Advanced Physics...'"

# Global instance
tools_registry = ToolsRegistry()
