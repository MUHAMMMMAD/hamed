"""
الأساس المشترك للوكلاء.
كل وكيل يجمع بين: محرك حسابي (تسعير/مخاطر/قرار) ورؤية من مجلس النماذج،
ويعمل على سياق مشترك (AgentContext) يتدفّق عبر خط الإنتاج.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from ..database import Database, db as default_db
from ..llm.council import Council
from ..models import (
    BidDecision,
    CashFlow,
    CostBreakdown,
    RiskAssessment,
    Tender,
)


@dataclass
class AgentContext:
    """السياق المشترك الذي يتدفّق بين الوكلاء."""
    tender: Tender
    db: Database = field(default_factory=lambda: default_db)
    council: Council = field(default_factory=Council)

    cost: Optional[CostBreakdown] = None
    risk: Optional[RiskAssessment] = None
    decision: Optional[BidDecision] = None
    cashflow: Optional[CashFlow] = None

    reports: dict = field(default_factory=dict)
    council_insights: dict = field(default_factory=dict)


class Agent:
    name: str = "agent"
    title: str = "وكيل"
    task: str = ""           # مهمة التوجيه في الـ Router (إن وُجدت)

    def run(self, ctx: AgentContext) -> dict:
        raise NotImplementedError

    # مساعد: استشارة المجلس وتخزين الرؤية في السياق
    def _consult(self, ctx: AgentContext, prompt: str, system: str | None = None) -> str:
        if not self.task:
            return ""
        resp = ctx.council.consult(self.task, prompt, system)
        ctx.council_insights[self.name] = resp.as_dict()
        return resp.content
