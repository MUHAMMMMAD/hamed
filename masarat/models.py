"""
نماذج البيانات الأساسية للنظام (Core Data Model).
يبني هذا الملف "قلب النظام": المواد، العمالة، المعدات، الموردين،
مقاولي الباطن، المشاريع السابقة، بنود الـ BOQ، والمناقصة.
"""
from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


# ===========================================================================
# تعدادات (Enums)
# ===========================================================================
class ProjectType(str, Enum):
    GOVERNMENT = "government"      # حكومي
    PRIVATE = "private"           # خاص
    EPC = "epc"                  # هندسة وتوريد وتنفيذ
    SUBCONTRACT = "subcontract"   # مقاول باطن


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ResourceType(str, Enum):
    MATERIAL = "material"
    LABOR = "labor"
    EQUIPMENT = "equipment"
    SUBCONTRACTOR = "subcontractor"


class BidDecisionType(str, Enum):
    BID = "BID"                              # تقديم
    NO_BID = "NO_BID"                        # عدم التقديم
    BID_WITH_CONDITIONS = "BID_WITH_CONDITIONS"  # تقديم بشروط


# ===========================================================================
# قواعد الأسعار (Price Libraries)
# ===========================================================================
class Material(BaseModel):
    id: str
    name_ar: str
    name_en: str
    unit: str                       # طن، م3، كيس، عدد ...
    unit_price: float               # السعر بالريال
    category: str = "general"
    trend_pct: float = 0.0          # اتجاه السعر الشهري %
    last_updated: Optional[str] = None


class Labor(BaseModel):
    id: str
    name_ar: str
    name_en: str
    daily_rate: float               # ريال / يوم
    productivity: Optional[float] = None  # إنتاجية (وحدة/يوم) - اختياري


class Equipment(BaseModel):
    id: str
    name_ar: str
    name_en: str
    unit: str                       # يوم / ساعة
    rate: float                     # السعر للوحدة


class Supplier(BaseModel):
    id: str
    name: str
    materials: List[str] = Field(default_factory=list)  # معرفات المواد
    lead_time_days: int = 7
    price_stability: float = 3.0    # ثبات السعر 1-5
    rating: float = 3.0             # التقييم 1-5
    last_updated: Optional[str] = None


class Subcontractor(BaseModel):
    id: str
    name: str
    activity: str                   # النشاط: أسوار، كهرباء ...
    unit_price: float
    unit: str = "m2"
    quality: float = 3.0            # الجودة 1-5
    timeliness: float = 3.0         # الالتزام الزمني 1-5
    risk: RiskLevel = RiskLevel.MEDIUM


class PastProject(BaseModel):
    id: str
    name: str
    client: str
    type: ProjectType
    location: str
    contract_value: float
    duration_months: int
    actual_cost: float
    actual_profit: float
    deviation_pct: float            # نسبة الانحراف %
    deviation_reason: str = ""      # سبب الانحراف


# ===========================================================================
# تحليل السعر وبنود الـ BOQ (Rate Analysis & BOQ)
# ===========================================================================
class ResourceUse(BaseModel):
    """استخدام مورد واحد لكل وحدة من البند (معامل تحليل السعر)."""
    resource_type: ResourceType
    resource_id: str
    coefficient: float              # كمية المورد لكل وحدة واحدة من البند


class BOQItem(BaseModel):
    """بند في جدول الكميات + تحليل سعره."""
    id: str
    description: str
    unit: str
    quantity: float
    resources: List[ResourceUse] = Field(default_factory=list)

    # القيم المحسوبة (يملؤها محرك التسعير)
    material_cost: float = 0.0
    labor_cost: float = 0.0
    equipment_cost: float = 0.0
    subcontractor_cost: float = 0.0
    other_cost: float = 0.0         # سعر إجمالي غير مُفصّل (من BOQ مُسعّر مسبقاً)
    unit_rate: float = 0.0          # تكلفة الوحدة المباشرة
    direct_total: float = 0.0       # إجمالي البند المباشر
    confidence: float = 0.0         # ثقة الذكاء الاصطناعي %
    source: str = "manual"          # مصدر التسعير (نموذج/يدوي)
    notes: str = ""


class Tender(BaseModel):
    """المناقصة / المشروع المراد تسعيره."""
    id: str
    name: str
    client: str
    type: ProjectType = ProjectType.PRIVATE
    location: str = "الرياض"
    items: List[BOQItem] = Field(default_factory=list)
    duration_months: int = 12
    client_reputation: float = 3.0  # سمعة العميل 1-5 (السداد)
    competition_level: float = 3.0  # مستوى المنافسة 1-5
    advance_payment_pct: float = 0.10  # الدفعة المقدمة
    retention_pct: float = 0.05     # المحتجزات


# ===========================================================================
# إعدادات ومخرجات التسعير
# ===========================================================================
class PricingConfig(BaseModel):
    overhead_pct: float = 0.10
    contingency_pct: float = 0.15
    profit_pct: float = 0.15
    vat_pct: float = 0.15


class CostBreakdown(BaseModel):
    materials: float = 0.0
    labor: float = 0.0
    equipment: float = 0.0
    subcontractors: float = 0.0
    other: float = 0.0              # بنود مُسعّرة بسعر إجمالي بلا تفصيل
    direct_cost: float = 0.0
    overhead: float = 0.0
    contingency: float = 0.0
    risk_adjustment: float = 0.0
    total_cost: float = 0.0
    profit: float = 0.0
    selling_price: float = 0.0      # قبل الضريبة
    vat: float = 0.0
    final_price: float = 0.0        # شامل الضريبة
    margin_pct: float = 0.0


# ===========================================================================
# نتائج المخاطر والقرار والتدفقات
# ===========================================================================
class RiskItem(BaseModel):
    category: str                   # سوق / تنفيذ / عقد / مورد / وقت
    description: str
    probability: float              # 1-5
    impact: float                   # 1-5
    score: float = 0.0              # = probability * impact
    level: RiskLevel = RiskLevel.MEDIUM
    mitigation: str = ""


class RiskAssessment(BaseModel):
    items: List[RiskItem] = Field(default_factory=list)
    total_score: float = 0.0
    risk_factor_pct: float = 0.0    # معامل تعديل المخاطر على التكلفة
    overall_level: RiskLevel = RiskLevel.MEDIUM


class BidDecision(BaseModel):
    decision: BidDecisionType
    score: float = 0.0              # 0-100
    win_probability: float = 0.0    # 0-100 احتمال الفوز
    rationale: str = ""
    conditions: List[str] = Field(default_factory=list)
    factors: dict = Field(default_factory=dict)


class CashFlowMonth(BaseModel):
    month: int
    cost: float = 0.0
    revenue: float = 0.0
    net: float = 0.0
    cumulative: float = 0.0


class CashFlow(BaseModel):
    months: List[CashFlowMonth] = Field(default_factory=list)
    peak_funding_required: float = 0.0   # أقصى عجز نقدي مطلوب تمويله
    final_cumulative: float = 0.0


class LearningInsight(BaseModel):
    """مخرجات محرك التعلّم من المشاريع السابقة (Cost Intelligence)."""
    sample_size: int = 0
    avg_deviation_pct: float = 0.0        # متوسط الانحراف التاريخي
    std_deviation_pct: float = 0.0        # الانحراف المعياري
    predicted_deviation_pct: float = 0.0  # الانحراف المتوقع لهذا المشروع
    recommended_contingency_pct: float = 15.0  # احتياطي موصى به
    recommended_margin_pct: float = 15.0  # هامش ربح موصى به
    calibrated_cost_factor: float = 1.0   # معامل معايرة التكلفة المباشرة
    confidence: float = 0.0               # ثقة التوصية %
    method: str = "historical_mean"       # regression | historical_mean
    notes: str = ""


# ===========================================================================
# نتيجة موحدة لكامل التحليل
# ===========================================================================
class TenderAnalysis(BaseModel):
    tender: Tender
    cost: CostBreakdown
    risk: RiskAssessment
    decision: BidDecision
    cashflow: CashFlow
    learning: Optional[LearningInsight] = None            # رؤى التعلّم الآلي
    agent_reports: dict = Field(default_factory=dict)   # تقرير كل وكيل
    council_insights: dict = Field(default_factory=dict)  # رؤى المجلس
