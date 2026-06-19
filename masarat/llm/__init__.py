"""
طبقة الذكاء الاصطناعي متعدد النماذج (Multi-LLM Council).
تربط ثمانية نماذج داخل محرك واحد، كلٌّ بدوره الخبير، ثم تدمج النتائج.
"""
from .base import LLMProvider, LLMResponse
from .providers import ALL_PROVIDERS, get_provider
from .router import Router
from .council import Council

__all__ = [
    "LLMProvider",
    "LLMResponse",
    "ALL_PROVIDERS",
    "get_provider",
    "Router",
    "Council",
]
