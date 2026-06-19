"""
موجّه المهام (Prompt Router).
يربط كل مهمة بالنموذج الخبير فيها، وفق توزيع الأدوار المعتمد لمسارات التشييد.
"""
from __future__ import annotations

from typing import List

from .providers import ALL_PROVIDERS, LLMProvider

# المهمة -> النموذج (أو النماذج) الخبير فيها
ROLE_ROUTING = {
    "pricing": ["chatgpt"],        # التحليل والتسعير النهائي
    "contracts": ["claude"],       # العقود والمخاطر القانونية
    "documents": ["gemini"],       # المستندات الضخمة والمواصفات
    "market": ["grok"],            # السوق وأسعار المواد
    "engineering": ["qwen"],       # التحليل الهندسي والمخططات
    "large_files": ["kimi"],       # الملفات الكبيرة
    "agents": ["minimax"],         # تشغيل الوكلاء
    "research": ["genspark"],      # البحث والتقارير
}


class Router:
    def route(self, task: str) -> List[LLMProvider]:
        names = ROLE_ROUTING.get(task)
        if not names:
            raise KeyError(
                f"مهمة غير معروفة: {task}. المتاح: {list(ROLE_ROUTING)}"
            )
        return [ALL_PROVIDERS[n] for n in names]

    def primary(self, task: str) -> LLMProvider:
        return self.route(task)[0]

    def ask(self, task: str, prompt: str, system: str | None = None):
        """يرسل الطلب للنموذج الخبير في هذه المهمة."""
        return self.primary(task).complete(prompt, system)
