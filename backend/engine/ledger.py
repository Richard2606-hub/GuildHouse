import json
import os
from datetime import datetime
from typing import Any, Dict

class Ledger:
    def __init__(self, filepath: str = "data/ledger.jsonl"):
        self.filepath = filepath
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)

    def _append(self, event_type: str, payload: Dict[str, Any]):
        """Append a structured record to the JSONL file."""
        record = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event_type": event_type,
            "payload": payload
        }
        with open(self.filepath, "a", encoding="utf-8") as f:
            f.write(json.dumps(record) + "\n")

    def log_boot(self, config_hash: str = "init"):
        self._append("boot", {"config_hash": config_hash})

    def log_session_start(self, session_id: str, pack_version: str = "unknown"):
        self._append("session_start", {"session_id": session_id, "pack_version": pack_version})

    def log_request(self, session_id: str, message: str):
        self._append("request_received", {"session_id": session_id, "message_length": len(message)})

    def log_local_draft(self, session_id: str, prompt_tokens: int, completion_tokens: int, confidence: float):
        self._append("local_draft", {
            "session_id": session_id,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "confidence": confidence
        })

    def log_escalation(self, session_id: str, rule: str, cost: float):
        self._append("escalation", {"session_id": session_id, "rule": rule, "estimated_cost": cost})

    def log_tool_invoked(self, session_id: str, tool_name: str, status: str = "success"):
        self._append("tool_invoked", {
            "session_id": session_id,
            "tool_name": tool_name,
            "status": status
        })

    def log_verdict(self, session_id: str, pack_name: str, total_tokens: int, escalated: bool):
        self._append("verdict", {
            "session_id": session_id,
            "pack_name": pack_name,
            "total_tokens": total_tokens,
            "escalated": escalated
        })

    def clear(self):
        """Clear the ledger file."""
        with open(self.filepath, "w", encoding="utf-8") as f:
            f.write("")

# Global instance for the runtime
house_ledger = Ledger()
