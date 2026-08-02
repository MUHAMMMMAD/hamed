/**
 * محرك التقدير الهندسي.
 *
 * يعمل بدورين:
 *  1. خط أساس حسابي يُمرَّر إلى النموذج ليبني عليه تحليله (بدل أن يخترع أرقاماً).
 *  2. بديل كامل يعمل وحده عند غياب مفتاح الـ API أو فشل الاتصال.
 *
 * الأسعار بالريال السعودي وتمثّل متوسطات سوق تقديرية للأغراض الاسترشادية،
 * ولا تُغني عن جدول كميات تفصيلي بعد المعاينة.
 */

import { z } from "zod";
import { ar, decimal } from "./format";

export const projectTypes = {
  villa: "فيلا سكنية",
  apartments: "عمارة سكنية",
  commercial: "مبنى تجاري / مكاتب",
  warehouse: "مستودع / منشأة صناعية",
  renovation: "ترميم وإعادة تأهيل",
  fitout: "تشطيب داخلي فقط",
} as const;

export const finishLevels = {
  economy: "اقتصادي",
  standard: "قياسي",
  premium: "مميّز",
  luxury: "فاخر",
} as const;

export const timelines = {
  relaxed: "مرن (بلا استعجال)",
  normal: "قياسي",
  fast: "مستعجل (مسار سريع)",
} as const;

export const estimateInputSchema = z.object({
  projectType: z.enum(Object.keys(projectTypes) as [keyof typeof projectTypes]),
  area: z.coerce.number().min(30, "المساحة صغيرة جداً").max(200_000, "المساحة كبيرة جداً"),
  floors: z.coerce.number().int().min(1).max(40),
  finishLevel: z.enum(Object.keys(finishLevels) as [keyof typeof finishLevels]),
  city: z.string().min(2).max(40),
  timeline: z.enum(Object.keys(timelines) as [keyof typeof timelines]),
  basement: z.boolean().default(false),
  includeDesign: z.boolean().default(false),
  notes: z.string().max(1200).optional().default(""),
});

export type EstimateInput = z.infer<typeof estimateInputSchema>;

/** سعر أساس للمتر المربع (ريال) عند مستوى تشطيب قياسي في الرياض. */
const BASE_RATE: Record<keyof typeof projectTypes, number> = {
  villa: 1800,
  apartments: 1650,
  commercial: 2100,
  warehouse: 950,
  renovation: 900,
  fitout: 1400,
};

const FINISH_FACTOR: Record<keyof typeof finishLevels, number> = {
  economy: 0.78,
  standard: 1,
  premium: 1.28,
  luxury: 1.65,
};

const TIMELINE_FACTOR: Record<keyof typeof timelines, number> = {
  relaxed: 0.97,
  normal: 1,
  fast: 1.08,
};

const CITY_FACTOR: Record<string, number> = {
  الرياض: 1,
  جدة: 1.04,
  الدمام: 1.02,
  القصيم: 0.93,
  أبها: 0.97,
  "المدينة المنورة": 0.98,
};

/** توزيع البنود كنسبة من التكلفة المباشرة، لكل نوع مشروع. */
const BREAKDOWN: Record<keyof typeof projectTypes, Record<string, number>> = {
  villa: {
    "أعمال الحفر والأساسات": 0.11,
    "الهيكل الخرساني": 0.26,
    "أعمال البناء والعزل": 0.12,
    "الأعمال الكهربائية": 0.08,
    "الأعمال الصحية والميكانيكية": 0.09,
    "التشطيبات الداخلية": 0.22,
    "الواجهات والأعمال الخارجية": 0.08,
    "إدارة المشروع والإشراف": 0.04,
  },
  apartments: {
    "أعمال الحفر والأساسات": 0.1,
    "الهيكل الخرساني": 0.29,
    "أعمال البناء والعزل": 0.12,
    "الأعمال الكهربائية": 0.09,
    "الأعمال الصحية والميكانيكية": 0.1,
    "التشطيبات الداخلية": 0.19,
    "الواجهات والأعمال الخارجية": 0.07,
    "إدارة المشروع والإشراف": 0.04,
  },
  commercial: {
    "أعمال الحفر والأساسات": 0.11,
    "الهيكل الخرساني": 0.25,
    "أعمال البناء والعزل": 0.09,
    "الأعمال الكهربائية": 0.12,
    "الأعمال الصحية والميكانيكية": 0.15,
    "التشطيبات الداخلية": 0.14,
    "الواجهات والأعمال الخارجية": 0.09,
    "إدارة المشروع والإشراف": 0.05,
  },
  warehouse: {
    "أعمال الحفر والأساسات": 0.16,
    "الهيكل الحديدي": 0.34,
    "الأرضيات الصناعية": 0.14,
    "الأعمال الكهربائية": 0.09,
    "أنظمة الإطفاء والسلامة": 0.11,
    "الأغلفة والواجهات": 0.08,
    "الساحات والأعمال الخارجية": 0.04,
    "إدارة المشروع والإشراف": 0.04,
  },
  renovation: {
    "الهدم والإزالة": 0.12,
    "المعالجات الإنشائية": 0.2,
    "أعمال البناء والعزل": 0.13,
    "الأعمال الكهربائية": 0.11,
    "الأعمال الصحية والميكانيكية": 0.12,
    "التشطيبات الداخلية": 0.24,
    "إدارة المشروع والإشراف": 0.08,
  },
  fitout: {
    "التقسيمات والجبس": 0.18,
    "الأرضيات": 0.16,
    "الدهانات والأسقف": 0.14,
    "الأعمال الكهربائية والإنارة": 0.15,
    "الأعمال الصحية": 0.08,
    "الأعمال الخشبية والمطابخ": 0.21,
    "إدارة المشروع والإشراف": 0.08,
  },
};

/** مدة مرجعية بالأشهر ومساحة مرجعية لكل نوع، تُستخدم في نموذج المدة. */
const DURATION_REF: Record<keyof typeof projectTypes, { months: number; area: number }> = {
  villa: { months: 12, area: 500 },
  apartments: { months: 18, area: 2500 },
  commercial: { months: 22, area: 6000 },
  warehouse: { months: 10, area: 8000 },
  renovation: { months: 7, area: 600 },
  fitout: { months: 5, area: 500 },
};

export type BreakdownItem = { label: string; amount: number; share: number };

export type EstimateResult = {
  input: EstimateInput;
  ratePerSqm: number;
  directCost: number;
  designFee: number;
  basementCost: number;
  contingency: number;
  vat: number;
  subtotal: number;
  total: number;
  low: number;
  high: number;
  months: number;
  monthsLow: number;
  monthsHigh: number;
  breakdown: BreakdownItem[];
  cashflow: { phase: string; percent: number; amount: number }[];
  assumptions: string[];
};

const round = (n: number, step = 1000) => Math.round(n / step) * step;

export function computeEstimate(input: EstimateInput): EstimateResult {
  const cityFactor = CITY_FACTOR[input.city.trim()] ?? 1;
  const finishFactor = FINISH_FACTOR[input.finishLevel];
  const timelineFactor = TIMELINE_FACTOR[input.timeline];

  // الأدوار فوق ٣: كلفة إضافية للرفع والسقالات وأنظمة النقل الرأسي.
  const floorFactor = 1 + Math.min(Math.max(input.floors - 3, 0) * 0.015, 0.22);

  // وفورات الحجم: المشاريع الكبيرة تنخفض كلفة مترها.
  const ref = DURATION_REF[input.projectType].area;
  const scaleFactor = Math.min(Math.max((input.area / ref) ** -0.06, 0.82), 1.14);

  const ratePerSqm =
    BASE_RATE[input.projectType] * finishFactor * cityFactor * timelineFactor * floorFactor * scaleFactor;

  const directCost = ratePerSqm * input.area;

  // القبو: حفر عميق وستائر ساندة وعزل — يُحتسب على مساحة دور نموذجي.
  const floorPlate = input.area / Math.max(input.floors, 1);
  const basementCost = input.basement ? floorPlate * 1450 * cityFactor : 0;

  const designFee = input.includeDesign ? (directCost + basementCost) * 0.04 : 0;

  const base = directCost + basementCost + designFee;
  const contingency = base * (input.projectType === "renovation" ? 0.1 : 0.05);
  const subtotal = base + contingency;
  const vat = subtotal * 0.15;
  const total = subtotal + vat;

  // نطاق عدم اليقين: الترميم أعلى تشتتاً لأن المفاجآت تظهر بعد الكشف.
  const spread = input.projectType === "renovation" ? 0.18 : 0.11;

  const shares = BREAKDOWN[input.projectType];
  const breakdown: BreakdownItem[] = Object.entries(shares).map(([label, share]) => ({
    label,
    share,
    amount: round(directCost * share, 500),
  }));

  const d = DURATION_REF[input.projectType];
  const durationFinish = 1 + (finishFactor - 1) * 0.45;
  const durationFloors = 1 + Math.min(Math.max(input.floors - 3, 0) * 0.02, 0.3);
  const durationTimeline = input.timeline === "fast" ? 0.85 : input.timeline === "relaxed" ? 1.1 : 1;
  const months =
    d.months * (input.area / d.area) ** 0.45 * durationFinish * durationFloors * durationTimeline +
    (input.basement ? 1.5 : 0);

  const m = Math.max(2, Math.round(months));

  const cashflowPlan =
    input.projectType === "fitout"
      ? [
          ["دفعة تحريك", 0.25],
          ["إنجاز ٤٠٪", 0.3],
          ["إنجاز ٨٠٪", 0.3],
          ["التسليم النهائي", 0.15],
        ]
      : [
          ["دفعة تحريك", 0.15],
          ["إنجاز الأساسات", 0.15],
          ["اكتمال الهيكل", 0.25],
          ["إنجاز البناء والعزل", 0.15],
          ["إنجاز التشطيبات ٨٠٪", 0.2],
          ["التسليم النهائي", 0.1],
        ];

  const cashflow = cashflowPlan.map(([phase, percent]) => ({
    phase: phase as string,
    percent: percent as number,
    amount: round(total * (percent as number), 500),
  }));

  const assumptions = [
    `المساحة المدخلة ${ar(input.area)} م² مسطحات بناء إجمالية وليست مساحة الأرض.`,
    `مستوى التشطيب: ${finishLevels[input.finishLevel]} — يشمل مواصفات مواد محددة تُعتمد بعيّنات قبل الشراء.`,
    `معامل مدينة ${input.city}: ${decimal(cityFactor)} مقارنة بالرياض كمرجع.`,
    `احتياطي طوارئ ${input.projectType === "renovation" ? "١٠٪" : "٥٪"} لمواجهة المتغيرات غير المنظورة.`,
    "ضريبة القيمة المضافة ١٥٪ محتسبة على الإجمالي.",
    "التقدير لا يشمل رسوم الرخص البلدية وتوصيل الخدمات (كهرباء ومياه) والأثاث.",
  ];

  if (input.basement) assumptions.push("يشمل التقدير قبواً واحداً بأعمال الحفر والستائر الساندة والعزل المائي.");
  if (input.includeDesign) assumptions.push("يشمل التقدير أتعاب التصميم المعماري والإنشائي بنسبة ٤٪.");
  if (input.timeline === "fast")
    assumptions.push("المسار السريع يرفع التكلفة ٨٪ مقابل خفض المدة ١٥٪ عبر ورديات إضافية وتوازي الأنشطة.");

  return {
    input,
    ratePerSqm: Math.round(ratePerSqm),
    directCost: round(directCost),
    designFee: round(designFee),
    basementCost: round(basementCost),
    contingency: round(contingency),
    vat: round(vat),
    subtotal: round(subtotal),
    total: round(total),
    low: round(total * (1 - spread), 5000),
    high: round(total * (1 + spread), 5000),
    months: m,
    monthsLow: Math.max(2, Math.round(m * 0.9)),
    monthsHigh: Math.round(m * 1.15),
    breakdown,
    cashflow,
    assumptions,
  };
}

/** ملخص نصي مضغوط يُمرَّر للنموذج كخط أساس حسابي. */
export function estimateToPrompt(r: EstimateResult): string {
  return [
    `نوع المشروع: ${projectTypes[r.input.projectType]}`,
    `المدينة: ${r.input.city} | المساحة: ${r.input.area} م² | الأدوار: ${r.input.floors} | قبو: ${r.input.basement ? "نعم" : "لا"}`,
    `مستوى التشطيب: ${finishLevels[r.input.finishLevel]} | الجدول: ${timelines[r.input.timeline]} | التصميم مشمول: ${r.input.includeDesign ? "نعم" : "لا"}`,
    `سعر المتر المحسوب: ${r.ratePerSqm} ريال`,
    `التكلفة المباشرة: ${r.directCost} | القبو: ${r.basementCost} | التصميم: ${r.designFee}`,
    `الاحتياطي: ${r.contingency} | الضريبة: ${r.vat} | الإجمالي: ${r.total} (نطاق ${r.low} – ${r.high})`,
    `المدة: ${r.months} شهراً (${r.monthsLow}–${r.monthsHigh})`,
    `توزيع البنود: ${r.breakdown.map((b) => `${b.label} ${Math.round(b.share * 100)}٪ = ${b.amount}`).join(" | ")}`,
    r.input.notes ? `ملاحظات العميل: ${r.input.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
