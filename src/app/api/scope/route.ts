import { NextRequest } from "next/server";
import { z } from "zod";
import { generateJson } from "@/lib/ai";
import { localScope } from "@/lib/fallback";
import { projectTypes } from "@/lib/estimator";

export const runtime = "nodejs";
export const maxDuration = 90;

const bodySchema = z.object({
  description: z.string().min(20, "اكتب وصفاً أوضح للمشروع").max(4000),
  projectType: z.string().min(2).max(60),
  city: z.string().min(2).max(40),
  area: z.coerce.number().min(0).max(200_000).optional(),
});

const ROLE =
  "إعداد وثائق نطاق عمل (Scope of Work) للمشاريع الإنشائية: تحديد الأعمال المشمولة وغير المشمولة، المراحل، التسليمات، ومعايير القبول.";

const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "عنوان المشروع المقترح." },
    overview: { type: "string", description: "فقرة تعريفية بالمشروع ونطاقه العام." },
    included: {
      type: "array",
      items: { type: "string" },
      description: "٦ إلى ١٢ بنداً للأعمال المشمولة، محددة وقابلة للقياس.",
    },
    excluded: {
      type: "array",
      items: { type: "string" },
      description: "٣ إلى ٦ بنود لأعمال غير مشمولة، لمنع النزاع لاحقاً.",
    },
    phases: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          duration: { type: "string", description: "المدة التقديرية، مثل: ٦ أسابيع." },
          deliverables: { type: "array", items: { type: "string" } },
        },
        required: ["name", "duration", "deliverables"],
        additionalProperties: false,
      },
      description: "٤ إلى ٧ مراحل تنفيذ متسلسلة.",
    },
    boq: {
      type: "array",
      items: {
        type: "object",
        properties: {
          item: { type: "string", description: "اسم البند." },
          unit: { type: "string", description: "وحدة القياس: م٢، م٣، م.ط، عدد." },
          note: { type: "string", description: "ملاحظة فنية موجزة عن مواصفة البند." },
        },
        required: ["item", "unit", "note"],
        additionalProperties: false,
      },
      description: "٦ إلى ١٢ بنداً رئيسياً لجدول الكميات المبدئي، بلا أسعار.",
    },
    acceptance: {
      type: "array",
      items: { type: "string" },
      description: "٣ إلى ٥ معايير قبول واضحة للتسليم النهائي.",
    },
    assumptions: {
      type: "array",
      items: { type: "string" },
      description: "٣ إلى ٥ افتراضات بُني عليها النطاق.",
    },
  },
  required: ["title", "overview", "included", "excluded", "phases", "boq", "acceptance", "assumptions"],
  additionalProperties: false,
} as const;

export type ScopeDoc = {
  title: string;
  overview: string;
  included: string[];
  excluded: string[];
  phases: { name: string; duration: string; deliverables: string[] }[];
  boq: { item: string; unit: string; note: string }[];
  acceptance: string[];
  assumptions: string[];
};

export async function POST(req: NextRequest) {
  let input;
  try {
    input = bodySchema.parse(await req.json());
  } catch {
    return Response.json({ error: "وصف المشروع غير كافٍ. اكتب ٢٠ حرفاً على الأقل." }, { status: 400 });
  }

  const typeLabel =
    projectTypes[input.projectType as keyof typeof projectTypes] ?? input.projectType;

  const doc = await generateJson<ScopeDoc>({
    role: ROLE,
    effort: "high",
    maxTokens: 8000,
    schema: SCHEMA as unknown as Record<string, unknown>,
    prompt: `أعدّ وثيقة نطاق عمل مبدئية للمشروع التالي:

- نوع المشروع: ${typeLabel}
- المدينة: ${input.city}
${input.area ? `- المساحة التقريبية: ${input.area} م²\n` : ""}- وصف العميل: ${input.description}

اجعل البنود محددة لهذا المشروع تحديداً ومطابقة للممارسة الهندسية السعودية والكود السعودي للبناء. لا تضع أسعاراً. تجنّب البنود العامة التي تصلح لأي مشروع.`,
  });

  if (!doc) {
    return Response.json({
      engine: "local",
      markdown: localScope(input.description, typeLabel, input.city),
      doc: null,
    });
  }

  return Response.json({ engine: "ai", doc, markdown: toMarkdown(doc) });
}

function toMarkdown(d: ScopeDoc): string {
  return `# ${d.title}

${d.overview}

## الأعمال المشمولة
${d.included.map((x) => `- ${x}`).join("\n")}

## الأعمال غير المشمولة
${d.excluded.map((x) => `- ${x}`).join("\n")}

## مراحل التنفيذ
${d.phases
  .map((p) => `### ${p.name} (${p.duration})\n${p.deliverables.map((x) => `- ${x}`).join("\n")}`)
  .join("\n\n")}

## جدول الكميات المبدئي
| البند | الوحدة | ملاحظة |
| --- | --- | --- |
${d.boq.map((b) => `| ${b.item} | ${b.unit} | ${b.note} |`).join("\n")}

## معايير القبول
${d.acceptance.map((x) => `- ${x}`).join("\n")}

## الافتراضات
${d.assumptions.map((x) => `- ${x}`).join("\n")}

---
وثيقة مبدئية استرشادية لا تُغني عن جدول كميات تفصيلي وعقد موقّع بعد المعاينة.`;
}
