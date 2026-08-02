import { NextRequest } from "next/server";
import { generateJson } from "@/lib/ai";
import { localEstimateSummary } from "@/lib/fallback";
import {
  computeEstimate,
  estimateInputSchema,
  estimateToPrompt,
  finishLevels,
  projectTypes,
} from "@/lib/estimator";

export const runtime = "nodejs";
export const maxDuration = 60;

const ROLE =
  "تحليل تقديرات تكلفة المشاريع الإنشائية وشرحها للعميل بلغة واضحة، مع تحديد المخاطر والتوصيات العملية.";

/** المخطط الذي يجب أن يلتزم به رد النموذج حرفياً. */
const SCHEMA = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "فقرة واحدة (٣-٤ أسطر) تلخص التكلفة والمدة وما تعنيه للعميل.",
    },
    recommendations: {
      type: "array",
      items: { type: "string" },
      description: "٣ إلى ٥ توصيات عملية محددة لخفض التكلفة أو تجنّب التأخير.",
    },
    risks: {
      type: "array",
      items: { type: "string" },
      description: "٣ إلى ٥ مخاطر واقعية قد ترفع التكلفة أو تمدد الجدول.",
    },
    valueEngineering: {
      type: "array",
      items: { type: "string" },
      description: "بندان إلى أربعة بنود لهندسة القيمة: أين يمكن التوفير دون المساس بالجودة الإنشائية.",
    },
    nextStep: {
      type: "string",
      description: "جملة واحدة تحدد الخطوة التالية الموصى بها للعميل.",
    },
  },
  required: ["summary", "recommendations", "risks", "valueEngineering", "nextStep"],
  additionalProperties: false,
} as const;

type AiAnalysis = {
  summary: string;
  recommendations: string[];
  risks: string[];
  valueEngineering: string[];
  nextStep: string;
};

export async function POST(req: NextRequest) {
  let input;
  try {
    input = estimateInputSchema.parse(await req.json());
  } catch {
    return Response.json({ error: "بيانات المشروع غير مكتملة أو غير صالحة" }, { status: 400 });
  }

  // المحرك الحسابي أولاً: هو مصدر الأرقام، والنموذج يشرحها ولا يخترعها.
  const estimate = computeEstimate(input);

  const analysis = await generateJson<AiAnalysis>({
    role: ROLE,
    effort: "medium",
    maxTokens: 4000,
    schema: SCHEMA as unknown as Record<string, unknown>,
    prompt: `فيما يلي تقدير محسوب هندسياً لمشروع عميل. مهمتك شرحه وتحليله — لا تُغيّر الأرقام ولا تقترح أرقاماً بديلة.

${estimateToPrompt(estimate)}

اكتب تحليلاً مخصصاً لهذا المشروع تحديداً (نوع ${projectTypes[input.projectType]}، مستوى تشطيب ${finishLevels[input.finishLevel]}، مدينة ${input.city}). تجنّب العبارات العامة التي تصلح لأي مشروع.`,
  });

  const local = localEstimateSummary(estimate);

  return Response.json({
    estimate,
    analysis: analysis ?? {
      summary: local.summary,
      recommendations: local.recommendations,
      risks: local.risks,
      valueEngineering: [
        "خفض مستوى التشطيب في المساحات الخدمية مع الإبقاء عليه في المساحات الرئيسية.",
        "توحيد مقاسات الأبواب والنوافذ لتقليل هدر التصنيع.",
        "اعتماد بدائل محلية معتمدة للمواد المستوردة ذات المواصفة المماثلة.",
      ],
      nextStep: "احجز معاينة ميدانية مجانية للحصول على جدول كميات تفصيلي وعرض سعر ملزم.",
    },
    engine: analysis ? "ai" : "local",
  });
}
