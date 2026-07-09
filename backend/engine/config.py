import os
from dotenv import load_dotenv

load_dotenv()

# --- Fireworks AI API ---
FIREWORKS_API_KEY = os.getenv("FIREWORKS_API_KEY", "")
FIREWORKS_BASE_URL = "https://api.fireworks.ai/inference/v1"

# --- Model Tiers ---
# Local tier: smaller, cheaper model (acts as the "resident" clerk brain)
LOCAL_MODEL = os.getenv("LOCAL_MODEL", "accounts/fireworks/models/glm-5p1")

# Escalation tier: larger, more capable model (the "guild expert")
ESCALATION_MODEL = os.getenv("ESCALATION_MODEL", "accounts/fireworks/models/deepseek-v4-pro")

# Confidence assessment model (small and fast)
JUDGE_MODEL = os.getenv("JUDGE_MODEL", "accounts/fireworks/models/glm-5p1")

# --- Routing Thresholds ---
ESCALATION_THRESHOLD = float(os.getenv("ESCALATION_THRESHOLD", "0.7"))

# --- Generation Defaults ---
DEFAULT_MAX_TOKENS = 1024
DEFAULT_TEMPERATURE = 0.7
JUDGE_MAX_TOKENS = 64
JUDGE_TEMPERATURE = 0.0
