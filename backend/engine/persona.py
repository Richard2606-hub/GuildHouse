from typing import Dict, Any


class PersonaEngine:
    """
    Persona rendering layer.
    
    Since the persona voice is now baked into the system prompt during generation
    (see inference.py build_system_prompt), this layer handles:
    - Formatting the final output
    - Adding clerk identity markers for the UI
    - Ensuring persona metadata is attached for the Inspector view
    """

    def __init__(self):
        pass

    def render(self, raw_draft: str, pack: Dict[str, Any]) -> str:
        """
        Final rendering pass. The LLM already speaks in the persona's voice
        (enforced via system prompt), so this layer just formats the output.
        """
        if not pack:
            return raw_draft

        # Clean up any leading/trailing whitespace
        rendered = raw_draft.strip()

        return rendered

    def get_persona_metadata(self, pack: Dict[str, Any]) -> Dict[str, str]:
        """Extract persona metadata for the frontend Inspector view."""
        persona = pack.get("persona", {})
        return {
            "clerk_name": pack.get("name", "Unknown Clerk"),
            "voice": persona.get("voice", "Standard"),
            "stance": persona.get("stance", "Neutral"),
            "description": pack.get("description", ""),
        }


# Global instance
persona_engine = PersonaEngine()
