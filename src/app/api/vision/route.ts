import { NextRequest } from "next/server";
import { analyzeImage, hasApiKey, type ImageMediaType } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 90;

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED: ImageMediaType[] = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const ROLE =
  "فحص صور مواقع البناء بصرياً: تقدير مرحلة الإنجاز، رصد ملاحظات السلامة، وتحديد ما يستحق انتباه المالك.";

const PROMPT = `افحص صورة موقع البناء هذه بصفتك مهندس موقع أول، واكتب تقريراً موجزاً بالعربية بهذا الترتيب:

**١. ما تراه** — وصف موضوعي لما يظهر في الصورة (نوع المنشأة، العناصر الإنشائية الظاهرة).
**٢. مرحلة الإنجاز** — تقدير المرحلة الحالية ونسبة إنجاز تقريبية، مع ذكر ما بُني عليه التقدير.
**٣. ملاحظات السلامة** — أي مخالفة أو خطر ظاهر (سقالات، حواف مكشوفة، معدات وقاية، ترتيب الموقع).
**٤. ملاحظات فنية** — جودة التنفيذ الظاهرة، أي عيب أو نقطة تستحق المتابعة.
**٥. توصيات** — ٢ إلى ٤ إجراءات محددة.

قواعد: اذكر صراحةً أن التقييم بصري من صورة واحدة ولا يُغني عن معاينة ميدانية. إن كانت الصورة غير واضحة أو لا تخص موقع بناء، قل ذلك مباشرةً ولا تُخمّن.`;

export async function POST(req: NextRequest) {
  if (!hasApiKey()) {
    return Response.json(
      {
        error:
          "تحليل الصور يتطلب تفعيل محرك الذكاء الاصطناعي (مفتاح ANTHROPIC_API_KEY). بقية أدوات الموقع تعمل بدونه.",
      },
      { status: 503 },
    );
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    const value = form.get("image");
    if (value instanceof File) file = value;
  } catch {
    return Response.json({ error: "تعذّرت قراءة الملف المرفوع" }, { status: 400 });
  }

  if (!file) return Response.json({ error: "لم يتم إرفاق صورة" }, { status: 400 });

  if (!ALLOWED.includes(file.type as ImageMediaType)) {
    return Response.json(
      { error: "صيغة غير مدعومة. استخدم JPG أو PNG أو WEBP." },
      { status: 415 },
    );
  }

  if (file.size > MAX_BYTES) {
    return Response.json({ error: "حجم الصورة يتجاوز ٥ ميجابايت" }, { status: 413 });
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  const report = await analyzeImage({
    role: ROLE,
    prompt: PROMPT,
    mediaType: file.type as ImageMediaType,
    base64,
    effort: "high",
  });

  if (!report) {
    return Response.json(
      { error: "تعذّر تحليل الصورة حالياً. يرجى إعادة المحاولة." },
      { status: 502 },
    );
  }

  return Response.json({ report });
}
