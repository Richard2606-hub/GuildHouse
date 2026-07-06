import uuid
from .ledger import house_ledger
from .inference import local_engine
from .gateway import gateway
from .loader import pack_loader
from .rules import rules_engine
from .persona import persona_engine

class SessionManager:
    def __init__(self):
        self.sessions = {}

    def create_session(self, pack_id: str) -> str:
        session_id = str(uuid.uuid4())
        pack = pack_loader.get_pack(pack_id)
        version = pack.get('version', 'unknown') if pack else 'unknown'
        
        self.sessions[session_id] = {
            "pack_id": pack_id,
            "history": [],
            "state": "active"
        }
        house_ledger.log_session_start(session_id, pack_version=version)
        return session_id

    async def process_request(self, session_id: str, prompt: str) -> str:
        """
        The core pipeline: 
        1. Log request
        2. Local Draft -> Gate -> Escalate (if needed)
        3. Rules Validation
        4. Persona Rendering
        5. Log verdict
        """
        session_data = self.sessions.get(session_id)
        if not session_data:
            return "Error: Invalid session."

        pack = pack_loader.get_pack(session_data["pack_id"])
        if not pack:
            return "Error: Pack not loaded."

        house_ledger.log_request(session_id, prompt)

        # 1. Local Draft
        local_draft, confidence = await local_engine.generate(prompt)
        house_ledger.log_local_draft(session_id, len(prompt), len(local_draft), confidence)

        # 2. Gate & Escalate
        final_answer, escalated = await gateway.gate_request(local_draft, confidence)
        if escalated:
            house_ledger.log_escalation(session_id, "low_confidence", 0.05)

        # 3. Rules Validation
        validated_answer = rules_engine.apply_rules(final_answer, pack)

        # 4. Persona Rendering
        rendered_answer = persona_engine.render(validated_answer, pack)

        # Update session history
        self.sessions[session_id]["history"].append({"user": prompt, "assistant": rendered_answer})

        return rendered_answer

# Global instance
session_manager = SessionManager()
