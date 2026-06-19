"""
الواجهة الأساسية لأي نموذج ذكاء اصطناعي (LLM Provider).
كل نموذج:
  - يعمل في "الوضع الحقيقي" عند توفّر مفتاح API.
  - يعمل في "الوضع التجريبي" (mock) بدون مفاتيح، فيُنتج رؤية منظّمة حسب دوره
    حتى يعمل النظام بالكامل بلا أي اعتماد خارجي.
"""
from __future__ import annotations

import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional

from .. import config


@dataclass
class LLMResponse:
    provider: str          # المفتاح الداخلي
    display_name: str      # الاسم المعروض
    model: str
    role: str              # الدور الذي قام به
    content: str           # النص الناتج
    confidence: float = 0.0
    offline: bool = True   # هل كان في الوضع التجريبي؟
    latency_ms: float = 0.0
    error: Optional[str] = None

    def as_dict(self) -> dict:
        return {
            "provider": self.provider,
            "display_name": self.display_name,
            "model": self.model,
            "role": self.role,
            "confidence": self.confidence,
            "offline": self.offline,
            "latency_ms": round(self.latency_ms, 1),
            "content": self.content,
            "error": self.error,
        }


class LLMProvider(ABC):
    # تُعرّف في الأصناف الفرعية
    name: str = "base"
    display_name: str = "Base"
    env_key: str = ""
    role: str = ""
    default_model: str = ""

    def __init__(self) -> None:
        self.api_key = config.API_KEYS.get(self.env_key, "")
        self.model = self.default_model

    @property
    def available(self) -> bool:
        """متاح فعلياً فقط عند وجود مفتاح وعدم إجبار الوضع التجريبي."""
        return bool(self.api_key) and not config.OFFLINE

    # ------------------------------------------------------------------
    def complete(self, prompt: str, system: Optional[str] = None) -> LLMResponse:
        start = time.time()
        if not self.available:
            resp = self._mock(prompt, system)
            resp.latency_ms = (time.time() - start) * 1000
            return resp
        try:
            resp = self._call(prompt, system)
            resp.offline = False
            resp.latency_ms = (time.time() - start) * 1000
            return resp
        except Exception as exc:  # الرجوع للوضع التجريبي عند أي خطأ
            resp = self._mock(prompt, system)
            resp.error = str(exc)
            resp.content = (
                f"⚠️ تعذّر الاتصال بالنموذج الحقيقي ({exc}). "
                f"النتيجة أدناه من الوضع التجريبي:\n\n" + resp.content
            )
            resp.latency_ms = (time.time() - start) * 1000
            return resp

    # ------------------------------------------------------------------
    @abstractmethod
    def _call(self, prompt: str, system: Optional[str]) -> LLMResponse:
        """الاستدعاء الحقيقي لواجهة النموذج. يُنفّذ في الأصناف الفرعية."""
        raise NotImplementedError

    # ------------------------------------------------------------------
    def _mock(self, prompt: str, system: Optional[str]) -> LLMResponse:
        """رؤية منظّمة بديلة حسب دور النموذج (تعمل بلا إنترنت)."""
        snippet = prompt.strip().replace("\n", " ")
        snippet = (snippet[:160] + "…") if len(snippet) > 160 else snippet
        content = (
            f"[وضع تجريبي] رؤية {self.display_name} ضمن دوره ({self.role}).\n"
            f"المُدخل: {snippet}\n"
            f"الخلاصة: تم تحليل المُدخل وفق اختصاص النموذج وإرجاع توصية مبدئية. "
            f"لتفعيل التحليل الحقيقي أضف المفتاح {self.env_key} في ملف .env."
        )
        return LLMResponse(
            provider=self.name,
            display_name=self.display_name,
            model=self.model + " (mock)",
            role=self.role,
            content=content,
            confidence=70.0,
            offline=True,
        )
