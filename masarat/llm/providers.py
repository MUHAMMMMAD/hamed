"""
النماذج الثمانية (Providers) وتوزيع الأدوار بينها.
معظم الواجهات متوافقة مع OpenAI (chat/completions) عدا Claude و Gemini.
كلها ترجع تلقائياً للوضع التجريبي عند غياب المفتاح أو فشل الاتصال.
"""
from __future__ import annotations

import os
from typing import List, Optional

from .. import config
from .base import LLMProvider, LLMResponse

try:
    import httpx
except Exception:  # pragma: no cover
    httpx = None


# ---------------------------------------------------------------------------
# مساعدات HTTP
# ---------------------------------------------------------------------------
def _openai_chat(base_url: str, api_key: str, model: str,
                 prompt: str, system: Optional[str]) -> str:
    """استدعاء واجهة متوافقة مع OpenAI."""
    if httpx is None:
        raise RuntimeError("httpx غير مثبّت")
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    r = httpx.post(
        f"{base_url}/chat/completions",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"model": model, "messages": messages, "temperature": 0.3},
        timeout=config.COUNCIL_TIMEOUT,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


def _anthropic_chat(api_key: str, model: str,
                    prompt: str, system: Optional[str]) -> str:
    if httpx is None:
        raise RuntimeError("httpx غير مثبّت")
    r = httpx.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": model,
            "max_tokens": 1500,
            "system": system or "",
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=config.COUNCIL_TIMEOUT,
    )
    r.raise_for_status()
    return "".join(b.get("text", "") for b in r.json().get("content", []))


def _gemini_chat(api_key: str, model: str,
                 prompt: str, system: Optional[str]) -> str:
    if httpx is None:
        raise RuntimeError("httpx غير مثبّت")
    text = (system + "\n\n" if system else "") + prompt
    r = httpx.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        params={"key": api_key},
        json={"contents": [{"parts": [{"text": text}]}]},
        timeout=config.COUNCIL_TIMEOUT,
    )
    r.raise_for_status()
    cands = r.json().get("candidates", [])
    if not cands:
        return ""
    return "".join(p.get("text", "") for p in cands[0]["content"]["parts"])


# ---------------------------------------------------------------------------
# النماذج المتوافقة مع OpenAI
# ---------------------------------------------------------------------------
class _OpenAICompatible(LLMProvider):
    base_url: str = "https://api.openai.com/v1"
    model_env: str = ""

    def __init__(self) -> None:
        super().__init__()
        if self.model_env:
            self.model = os.getenv(self.model_env, self.default_model)

    def _call(self, prompt: str, system: Optional[str]) -> LLMResponse:
        content = _openai_chat(self.base_url, self.api_key, self.model, prompt, system)
        return LLMResponse(
            provider=self.name, display_name=self.display_name, model=self.model,
            role=self.role, content=content, confidence=90.0, offline=False,
        )


class ChatGPT(_OpenAICompatible):
    name = "chatgpt"
    display_name = "ChatGPT (OpenAI)"
    env_key = "openai"
    role = "التحليل والتسعير النهائي"
    default_model = "gpt-4o"
    base_url = "https://api.openai.com/v1"
    model_env = "OPENAI_MODEL"


class Grok(_OpenAICompatible):
    name = "grok"
    display_name = "Grok (xAI)"
    env_key = "xai"
    role = "متابعة السوق وأسعار المواد والمنافسين"
    default_model = "grok-2-latest"
    base_url = "https://api.x.ai/v1"
    model_env = "XAI_MODEL"


class Qwen(_OpenAICompatible):
    name = "qwen"
    display_name = "Qwen (Alibaba)"
    env_key = "qwen"
    role = "التحليل الهندسي ودعم العربية والمخططات"
    default_model = "qwen-max"
    base_url = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
    model_env = "QWEN_MODEL"


class Kimi(_OpenAICompatible):
    name = "kimi"
    display_name = "Kimi (Moonshot)"
    env_key = "moonshot"
    role = "قراءة الملفات الضخمة واستخراج المتطلبات"
    default_model = "moonshot-v1-128k"
    base_url = "https://api.moonshot.cn/v1"
    model_env = "MOONSHOT_MODEL"


class MiniMax(_OpenAICompatible):
    name = "minimax"
    display_name = "MiniMax"
    env_key = "minimax"
    role = "بناء وتشغيل الوكلاء الذكيين وأتمتة سير العمل"
    default_model = "abab6.5s-chat"
    base_url = "https://api.minimaxi.chat/v1"
    model_env = "MINIMAX_MODEL"


class Genspark(_OpenAICompatible):
    name = "genspark"
    display_name = "Genspark"
    env_key = "genspark"
    role = "البحث الذكي وإعداد التقارير"
    default_model = "genspark-default"
    base_url = os.getenv("GENSPARK_BASE_URL", "https://api.genspark.ai/v1")
    model_env = "GENSPARK_MODEL"


# ---------------------------------------------------------------------------
# النماذج ذات الواجهات الخاصة
# ---------------------------------------------------------------------------
class Claude(LLMProvider):
    name = "claude"
    display_name = "Claude (Anthropic)"
    env_key = "anthropic"
    role = "مراجعة العقود واكتشاف المخاطر القانونية والشروط الخاصة"
    default_model = "claude-sonnet-4-6"

    def __init__(self) -> None:
        super().__init__()
        self.model = os.getenv("ANTHROPIC_MODEL", self.default_model)

    def _call(self, prompt: str, system: Optional[str]) -> LLMResponse:
        content = _anthropic_chat(self.api_key, self.model, prompt, system)
        return LLMResponse(
            provider=self.name, display_name=self.display_name, model=self.model,
            role=self.role, content=content, confidence=92.0, offline=False,
        )


class Gemini(LLMProvider):
    name = "gemini"
    display_name = "Gemini (Google)"
    env_key = "google"
    role = "قراءة المستندات الضخمة وتحليل المواصفات الفنية"
    default_model = "gemini-1.5-pro"

    def __init__(self) -> None:
        super().__init__()
        self.model = os.getenv("GEMINI_MODEL", self.default_model)

    def _call(self, prompt: str, system: Optional[str]) -> LLMResponse:
        content = _gemini_chat(self.api_key, self.model, prompt, system)
        return LLMResponse(
            provider=self.name, display_name=self.display_name, model=self.model,
            role=self.role, content=content, confidence=88.0, offline=False,
        )


# ---------------------------------------------------------------------------
# السجل المركزي للنماذج
# ---------------------------------------------------------------------------
_PROVIDER_CLASSES = [
    ChatGPT, Claude, Gemini, Grok, Qwen, Kimi, MiniMax, Genspark,
]

ALL_PROVIDERS = {cls.name: cls() for cls in _PROVIDER_CLASSES}


def get_provider(name: str) -> LLMProvider:
    if name not in ALL_PROVIDERS:
        raise KeyError(f"نموذج غير معروف: {name}. المتاح: {list(ALL_PROVIDERS)}")
    return ALL_PROVIDERS[name]


def provider_status() -> List[dict]:
    """حالة كل نموذج (متاح فعلياً أم وضع تجريبي)."""
    return [
        {
            "name": p.name,
            "display_name": p.display_name,
            "model": p.model,
            "role": p.role,
            "available": p.available,
            "mode": "حقيقي" if p.available else "تجريبي",
        }
        for p in ALL_PROVIDERS.values()
    ]
