import uuid
from typing import Dict, Any

from .ledger import house_ledger
from .inference import local_engine
from .gateway import gateway
from .loader import pack_loader
from .rules import rules_engine
from .persona import persona_engine
from .tools import tools_registry
from .retrieval import retrieval_engine


class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, Dict[str, Any]] = {}

    def create_session(self, pack_id: str) -> str:
        session_id = str(uuid.uuid4())
        pack = pack_loader.get_pack(pack_id)
        version = pack.get("version", "unknown") if pack else "unknown"

        self.sessions[session_id] = {
            "pack_id": pack_id,
            "history": [],
            "state": "active",
        }
        house_ledger.log_session_start(session_id, pack_version=version)
        return session_id

    def _detect_tool_intent(self, message: str, pack: Dict[str, Any]) -> str:
        """Detect if the user's message implies a tool should be used."""
        tools = pack.get("tools", [])
        msg_lower = message.lower()

        if "ocr" in tools and any(kw in msg_lower for kw in ["scan", "extract text", "read document", "ocr", "receipt"]):
            return "ocr"
        if "vision" in tools and any(kw in msg_lower for kw in ["image", "picture", "photo", "screenshot", "look at", "analyze image"]):
            return "vision"
        if "media_pipeline" in tools and any(kw in msg_lower for kw in ["video", "lecture", "recording", "media", "watch", "transcript"]):
            return "media_pipeline"

        return ""

    async def process_request(self, session_id: str, prompt: str) -> Dict[str, Any]:
        """
        The complete GuildHouse pipeline:

        1. Load pack context
        2. Detect tool intent, execute if needed
        3. Local Draft (cheap model via Fireworks AI)
        4. Confidence Gate -> Escalate if needed (expensive model)
        5. Rules Validation (forbidden topics, redaction)
        6. Persona Rendering
        7. Log everything to the Ledger
        """
        session_data = self.sessions.get(session_id)
        if not session_data:
            return {"text": "Error: Invalid session.", "metadata": {}}

        pack_id = session_data["pack_id"]
        pack = pack_loader.get_pack(pack_id)
        if not pack:
            return {"text": "Error: Pack not loaded.", "metadata": {}}

        history = session_data.get("history", [])

        # Log the incoming request
        house_ledger.log_request(session_id, prompt)

        # --- Step 0: Tool Detection ---
        tool_context = ""
        tool_used = ""
        detected_tool = self._detect_tool_intent(prompt, pack)
        if detected_tool:
            tool_result = await tools_registry.execute_tool(detected_tool, prompt, pack)
            tool_context = f"\n\n[Tool Result from {detected_tool}]: {tool_result}"
            tool_used = detected_tool
            house_ledger.log_tool_invoked(session_id, detected_tool)

        # --- Step 0.5: Knowledge Retrieval (Fact Locking) ---
        retrieved_passages = retrieval_engine.retrieve(pack_id, prompt, top_k=2)
        retrieval_context = ""
        if retrieved_passages:
            retrieval_context = "\n\n[Retrieved Context from Corpus]:\n" + "\n---\n".join(retrieved_passages)

        # --- Step 1: Local Draft (cheap model) ---
        enhanced_prompt = prompt + tool_context + retrieval_context
        local_draft, local_tokens = await local_engine.generate(
            prompt=enhanced_prompt,
            pack=pack,
            history=history,
        )

        # --- Step 2: Confidence Gate -> Escalation ---
        system_prompt = local_engine.build_system_prompt(pack)
        final_answer, escalated, confidence, escalation_tokens = await gateway.gate_request(
            local_draft=local_draft,
            user_prompt=prompt,
            system_prompt=system_prompt,
            history=history,
        )

        house_ledger.log_local_draft(session_id, local_tokens, escalation_tokens, confidence)

        if escalated:
            house_ledger.log_escalation(session_id, "low_confidence", escalation_tokens)

        # --- Step 3: Rules Validation ---
        validated_answer = rules_engine.apply_rules(final_answer, pack)

        # --- Step 4: Persona Rendering ---
        rendered_answer = persona_engine.render(validated_answer, pack)

        # --- Step 5: Update session history ---
        session_data["history"].append({
            "user": prompt,
            "assistant": rendered_answer,
        })

        # --- Step 6: Log verdict ---
        total_tokens = local_tokens + escalation_tokens
        house_ledger.log_verdict(session_id, pack.get("name", "Unknown"), total_tokens, escalated)

        # Build pipeline metadata for the frontend Inspector
        metadata = {
            "pack_name": pack.get("name", "Unknown"),
            "local_tokens": local_tokens,
            "escalated": escalated,
            "confidence": round(confidence, 3),
            "escalation_tokens": escalation_tokens,
            "total_tokens": total_tokens,
            "rules_applied": len(pack.get("rules", [])),
            "tool_used": tool_used,
            "persona": persona_engine.get_persona_metadata(pack),
        }

        return {"text": rendered_answer, "metadata": metadata}

    def get_session_info(self, session_id: str) -> Dict[str, Any]:
        """Get session information."""
        data = self.sessions.get(session_id)
        if not data:
            return {}
        return {
            "session_id": session_id,
            "pack_id": data["pack_id"],
            "message_count": len(data["history"]),
            "state": data["state"],
        }


# Global instance
session_manager = SessionManager()
