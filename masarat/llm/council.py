"""
المجلس (Multi-LLM Council).
يدير الاستشارة: إمّا توجيه مهمة لنموذج خبير واحد، أو "مداولة" يُسأل فيها
عدة نماذج بالتوازي ثم تُدمج آراؤها في خلاصة واحدة.
"""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Optional

from .base import LLMResponse
from .providers import ALL_PROVIDERS, provider_status
from .router import Router


class Council:
    def __init__(self) -> None:
        self.router = Router()

    # ------------------------------------------------------------------
    def consult(self, task: str, prompt: str, system: Optional[str] = None) -> LLMResponse:
        """استشارة النموذج الخبير في مهمة محددة."""
        return self.router.ask(task, prompt, system)

    # ------------------------------------------------------------------
    def deliberate(
        self,
        prompt: str,
        system: Optional[str] = None,
        providers: Optional[List[str]] = None,
    ) -> Dict:
        """
        مداولة جماعية: يُسأل عدة نماذج بالتوازي وتُجمع الردود + خلاصة.
        """
        names = providers or list(ALL_PROVIDERS.keys())
        responses: List[LLMResponse] = []

        with ThreadPoolExecutor(max_workers=len(names)) as pool:
            futures = {
                pool.submit(ALL_PROVIDERS[n].complete, prompt, system): n
                for n in names
                if n in ALL_PROVIDERS
            }
            for fut in as_completed(futures):
                try:
                    responses.append(fut.result())
                except Exception as exc:  # pragma: no cover
                    name = futures[fut]
                    responses.append(
                        LLMResponse(
                            provider=name,
                            display_name=ALL_PROVIDERS[name].display_name,
                            model="-",
                            role=ALL_PROVIDERS[name].role,
                            content=f"خطأ: {exc}",
                            confidence=0.0,
                            error=str(exc),
                        )
                    )

        responses.sort(key=lambda r: r.confidence, reverse=True)
        avg_conf = (
            sum(r.confidence for r in responses) / len(responses)
            if responses else 0.0
        )
        return {
            "responses": [r.as_dict() for r in responses],
            "consensus_confidence": round(avg_conf, 1),
            "summary": self._synthesize(responses),
        }

    # ------------------------------------------------------------------
    def _synthesize(self, responses: List[LLMResponse]) -> str:
        """خلاصة مبسطة تدمج رؤوس النماذج (يمكن لاحقاً إسنادها لنموذج قائد)."""
        real = [r for r in responses if not r.offline]
        mode = (
            f"{len(real)} نموذج حقيقي + {len(responses) - len(real)} تجريبي"
            if real else "كل النماذج في الوضع التجريبي"
        )
        lines = [f"خلاصة مجلس الذكاء الاصطناعي ({mode}):"]
        for r in responses:
            head = r.content.strip().split("\n")[0]
            lines.append(f"• {r.display_name} [{r.role}]: {head}")
        return "\n".join(lines)

    # ------------------------------------------------------------------
    def status(self) -> List[dict]:
        return provider_status()
