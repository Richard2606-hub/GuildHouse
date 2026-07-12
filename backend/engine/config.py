import os
from dotenv import load_dotenv

load_dotenv()

# --- Gemini AI API ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# --- Fireworks AI API ---
FIREWORKS_API_KEY = os.getenv("FIREWORKS_API_KEY", "")
FIREWORKS_BASE_URL = "https://api.fireworks.ai/inference/v1"

# --- Provider Selection ---
# Set to 'gemini' or 'fireworks'
LOCAL_PROVIDER = os.getenv("LOCAL_PROVIDER", "fireworks")
ESCALATION_PROVIDER = os.getenv("ESCALATION_PROVIDER", "gemini")
JUDGE_PROVIDER = os.getenv("JUDGE_PROVIDER", "fireworks")
TOOL_PROVIDER = os.getenv("TOOL_PROVIDER", "gemini")

# --- Model Tiers ---
# Local tier: smaller, cheaper model (acts as the "resident" clerk brain)
LOCAL_MODEL = os.getenv("LOCAL_MODEL", "accounts/fireworks/models/gemma2-9b-it")

# Escalation tier: larger, more capable model (the "guild expert")
ESCALATION_MODEL = os.getenv("ESCALATION_MODEL", "gemini-3.1-flash-lite")

# Confidence assessment model (small and fast)
JUDGE_MODEL = os.getenv("JUDGE_MODEL", "accounts/fireworks/models/gemma2-9b-it")

# --- Routing Thresholds ---
ESCALATION_THRESHOLD = float(os.getenv("ESCALATION_THRESHOLD", "0.7"))

# --- Generation Defaults ---
DEFAULT_MAX_TOKENS = 1024
DEFAULT_TEMPERATURE = 0.7
JUDGE_MAX_TOKENS = 64
JUDGE_TEMPERATURE = 0.0
