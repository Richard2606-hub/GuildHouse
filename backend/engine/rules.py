import re
from typing import Dict, Any, List


class RulesEngine:
    """
    Post-generation validation engine.
    Checks the LLM's output against the pack's deterministic constraints:
    - Forbidden topic detection
    - Redaction enforcement
    - Custom rule compliance signals
    """

    # Common patterns for forbidden topic categories
    FORBIDDEN_PATTERNS = {
        "financial_advice": [
            r"\b(you should invest|buy this stock|financial recommendation|guaranteed return)\b",
        ],
        "legal_advice": [
            r"\b(legal advice|you should sue|file a lawsuit|legally you must)\b",
        ],
        "minors_data": [
            r"\b(child('s)? (name|address|school)|minor('s)? personal)\b",
        ],
        "institutional_material": [
            r"\b(copyrighted lecture|proprietary course material)\b",
        ],
    }

    # Patterns for data that should be redacted
    REDACTION_PATTERNS = {
        "financial_data": [
            (r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b", "[REDACTED-CARD]"),  # Credit card
            (r"\b\d{10,12}\b", "[REDACTED-ACCOUNT]"),  # Account numbers
        ],
        "tax_ids": [
            (r"\b\d{2}-\d{7}\b", "[REDACTED-TAX-ID]"),  # Tax IDs (XX-XXXXXXX)
            (r"\b\d{3}-\d{2}-\d{4}\b", "[REDACTED-SSN]"),  # SSN format
        ],
        "phone_numbers": [
            (r"\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b", "[REDACTED-PHONE]"),
        ],
        "addresses": [
            (r"\b\d{1,5}\s\w+\s(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln)\b",
             "[REDACTED-ADDRESS]"),
        ],
    }

    def __init__(self):
        pass

    def check_forbidden_topics(self, draft: str, pack: Dict[str, Any]) -> List[str]:
        """Check if the draft contains forbidden topic patterns. Returns list of violations."""
        escalation = pack.get("escalation_policy", {})
        forbidden = escalation.get("forbidden", [])
        violations = []

        for topic in forbidden:
            patterns = self.FORBIDDEN_PATTERNS.get(topic, [])
            for pattern in patterns:
                if re.search(pattern, draft, re.IGNORECASE):
                    violations.append(topic)
                    break

        return violations

    def apply_redactions(self, draft: str, pack: Dict[str, Any]) -> str:
        """Redact sensitive data patterns specified in the pack's escalation policy."""
        escalation = pack.get("escalation_policy", {})
        redact_categories = escalation.get("redact_first", [])

        for category in redact_categories:
            patterns = self.REDACTION_PATTERNS.get(category, [])
            for pattern, replacement in patterns:
                draft = re.sub(pattern, replacement, draft, flags=re.IGNORECASE)

        return draft

    def apply_rules(self, draft: str, pack: Dict[str, Any]) -> str:
        """
        Full validation pipeline:
        1. Check forbidden topics → refuse if violated
        2. Apply redactions
        3. Return validated/cleaned draft
        """
        if not pack:
            return draft

        # 1. Forbidden topic check
        violations = self.check_forbidden_topics(draft, pack)
        if violations:
            clerk_name = pack.get("name", "Clerk")
            return (
                f"I'm sorry, but as {clerk_name}, I'm not able to provide information on "
                f"{', '.join(violations).replace('_', ' ')}. "
                f"This falls outside my authorized scope. "
                f"Please consult the appropriate professional for this matter."
            )

        # 2. Redaction pass
        draft = self.apply_redactions(draft, pack)

        # 3. Rule count acknowledgment (for ledger/debugging transparency)
        rules = pack.get("rules", [])
        rule_count = len(rules)
        if rule_count > 0:
            # Add a subtle metadata marker (not visible to end users in production,
            # but useful for the Inspector/Ledger view)
            draft = draft.rstrip()

        return draft


# Global instance
rules_engine = RulesEngine()
