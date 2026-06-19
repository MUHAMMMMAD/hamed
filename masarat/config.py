"""
الإعدادات المركزية للنظام - تحميل المفاتيح والمسارات والثوابت.
Central configuration: API keys, paths, pricing defaults.
"""
from __future__ import annotations

import os
from pathlib import Path

# تحميل ملف .env إن وُجد (اختياري)
try:
    from dotenv import load_dotenv

    load_dotenv()
except Exception:  # pragma: no cover - python-dotenv قد لا يكون مثبتاً
    pass

# ---------------------------------------------------------------------------
# المسارات
# ---------------------------------------------------------------------------
ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data" / "seed"
OUTPUT_DIR = ROOT_DIR / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def _flag(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


# ---------------------------------------------------------------------------
# مفاتيح نماذج الذكاء الاصطناعي
# ---------------------------------------------------------------------------
API_KEYS = {
    "openai": os.getenv("OPENAI_API_KEY", ""),
    "anthropic": os.getenv("ANTHROPIC_API_KEY", ""),
    "google": os.getenv("GOOGLE_API_KEY", ""),
    "xai": os.getenv("XAI_API_KEY", ""),
    "qwen": os.getenv("QWEN_API_KEY", ""),
    "moonshot": os.getenv("MOONSHOT_API_KEY", ""),
    "minimax": os.getenv("MINIMAX_API_KEY", ""),
    "genspark": os.getenv("GENSPARK_API_KEY", ""),
}

# إجبار الوضع التجريبي (يعمل بدون أي مفاتيح حقيقية)
OFFLINE = _flag("MASARAT_OFFLINE", False)

# مهلة استدعاء النماذج بالثواني
COUNCIL_TIMEOUT = int(os.getenv("MASARAT_COUNCIL_TIMEOUT", "60"))

# ---------------------------------------------------------------------------
# الثوابت الافتراضية لمحرك التسعير (قابلة للتعديل لكل مشروع)
# ---------------------------------------------------------------------------
DEFAULT_OVERHEAD_PCT = 0.10      # المصاريف الإدارية والعمومية
DEFAULT_CONTINGENCY_PCT = 0.15   # الاحتياطي
DEFAULT_PROFIT_PCT = 0.15        # هامش الربح
VAT_PCT = 0.15                   # ضريبة القيمة المضافة (السعودية)

CURRENCY = "SAR"
CURRENCY_AR = "ريال"
