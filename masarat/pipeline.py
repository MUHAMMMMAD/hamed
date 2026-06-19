"""
خط الإنتاج الموحّد (End-to-End Pipeline).
يأخذ مناقصة (BOQ) ويمرّرها على فريق الوكلاء بالترتيب، ثم يُخرج تحليلاً موحّداً:
تسعير كامل + مخاطر + قرار Bid/No-Bid + تدفقات نقدية + تقارير الوكلاء ورؤى المجلس.
"""
from __future__ import annotations

from typing import Optional

from .agents import AgentContext, build_team
from .database import Database, db as default_db
from .llm.council import Council
from .models import Tender, TenderAnalysis


def analyze_tender(
    tender: Tender,
    database: Optional[Database] = None,
    council: Optional[Council] = None,
) -> TenderAnalysis:
    """يشغّل التحليل الكامل ويُعيد النتيجة الموحّدة."""
    ctx = AgentContext(
        tender=tender,
        db=database or default_db,
        council=council or Council(),
    )

    for agent in build_team():
        agent.run(ctx)

    return TenderAnalysis(
        tender=ctx.tender,
        cost=ctx.cost,
        risk=ctx.risk,
        decision=ctx.decision,
        cashflow=ctx.cashflow,
        agent_reports=ctx.reports,
        council_insights=ctx.council_insights,
    )
