/**
 * طبقة الذكاء الاصطناعي.
 *
 * كل استدعاء هنا محاط بمسار احتياطي: إن غاب المفتاح أو فشل الاتصال يعود الموقع
 * إلى المحرك المحلي بدل أن يُظهر خطأ للزائر.
 */

import Anthropic from "@anthropic-ai/sdk";
import { company, knowledgeBase } from "./company";

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

/** مستويات الجهد: نرفعها للمهام التحليلية ونخفضها للمحادثة السريعة. */
export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

let cached: Anthropic | null = null;

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

function client(): Anthropic {
  if (!cached) cached = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return cached;
}

/**
 * موجّه النظام المشترك: يحقن قاعدة معرفة الشركة ويضبط اللهجة والحدود
 * حتى لا يَعِد النموذج بما لا تلتزم به الشركة تعاقدياً.
 */
export function systemPrompt(role: string): string {
  return `أنت مساعد ذكي يعمل لصالح "${company.name}"، شركة مقاولات سعودية. دورك: ${role}

# قواعد ملزمة
- اكتب بالعربية الفصحى المبسّطة دائماً، بنبرة مهنية هادئة بلا مبالغة تسويقية.
- اعتمد حصراً على بيانات الشركة أدناه. إن سُئلت عن معلومة غير موجودة فيها، قل ذلك صراحةً واطلب التواصل مع الفريق بدل تخمين الإجابة.
- أي رقم تذكره هو تقدير استرشادي وليس عرض سعر ملزم؛ العرض النهائي يصدر بعد المعاينة وجدول الكميات. اذكر ذلك عند الحديث عن الأسعار.
- لا تَعِد بمدد أو ضمانات أو خصومات لم ترد في البيانات.
- اجعل الإجابة موجزة ومباشرة: ابدأ بالخلاصة ثم التفاصيل. تجنّب الحشو والمقدمات الطويلة.
- إن طلب العميل عرض سعر أو معاينة، وجّهه إلى نموذج طلب عرض السعر في صفحة "تواصل معنا" أو الاتصال على ${company.phone}.

# بيانات الشركة
${knowledgeBase()}`;
}

/**
 * البديل من جهة الخادم: إن رفضت مصنّفات السلامة الطلب يُعاد تشغيله تلقائياً
 * على نموذج بديل بدل أن يصل الرفض إلى الزائر.
 * تحمل حزمة الـ SDK الحالية أنواعاً لا تغطي الحقلين بعد، لذا نمرّرهما عبر تحويل صريح.
 */
const FALLBACK_PARAMS = {
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default",
} as const;

type CreateParams = Anthropic.MessageCreateParamsNonStreaming;

/**
 * استدعاء غير متدفق مع تفعيل البديل.
 * إن رفض الحساب ترويسة البيتا نعيد المحاولة مرة واحدة بدونها بدل إسقاط الطلب.
 */
async function create(params: CreateParams): Promise<Anthropic.Message> {
  try {
    const res = await client().beta.messages.create({
      ...params,
      ...FALLBACK_PARAMS,
    } as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming);
    return res as unknown as Anthropic.Message;
  } catch (err) {
    if (!isBetaRejection(err)) throw err;
    return await client().messages.create(params);
  }
}

function isBetaRejection(err: unknown): boolean {
  if (!(err instanceof Anthropic.APIError)) return false;
  if (err.status !== 400 && err.status !== 404) return false;
  const msg = String(err.message ?? "").toLowerCase();
  return msg.includes("beta") || msg.includes("fallback");
}

/** استخراج النص من رد النموذج، مع احترام حالة الرفض. */
export function textOf(message: Anthropic.Message): string | null {
  if (message.stop_reason === "refusal") return null;
  return (
    message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim() || null
  );
}

/**
 * توليد كائن JSON مطابق لمخطط محدد.
 * يعيد null عند أي فشل ليتولى المحرك المحلي المهمة.
 */
export async function generateJson<T>(args: {
  role: string;
  prompt: string;
  schema: Record<string, unknown>;
  effort?: Effort;
  maxTokens?: number;
}): Promise<T | null> {
  if (!hasApiKey()) return null;

  try {
    const res = await create({
      model: MODEL,
      max_tokens: args.maxTokens ?? 8000,
      system: systemPrompt(args.role),
      messages: [{ role: "user", content: args.prompt }],
      output_config: {
        effort: args.effort ?? "medium",
        format: { type: "json_schema", schema: args.schema },
      },
    } as CreateParams);

    const text = textOf(res);
    return text ? (JSON.parse(text) as T) : null;
  } catch (err) {
    console.error("[ai] generateJson failed:", err);
    return null;
  }
}

/** بث نصي للمحادثة. يعيد null إن تعذّر بدء الاتصال. */
export function streamText(args: {
  role: string;
  messages: Anthropic.MessageParam[];
  effort?: Effort;
  maxTokens?: number;
}): ReadableStream<Uint8Array> | null {
  if (!hasApiKey()) return null;

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = client().messages.stream({
          model: MODEL,
          max_tokens: args.maxTokens ?? 2048,
          system: systemPrompt(args.role),
          messages: args.messages,
          output_config: { effort: args.effort ?? "low" },
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(
            encoder.encode(
              "يتعذّر عليّ معالجة هذا الطلب. يسعدني مساعدتك في أي استفسار يخص المقاولات والبناء.",
            ),
          );
        }
      } catch (err) {
        console.error("[ai] stream failed:", err);
        controller.enqueue(
          encoder.encode("\n\nانقطع الاتصال بالمساعد. يرجى إعادة المحاولة."),
        );
      } finally {
        controller.close();
      }
    },
  });
}

export type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

/** تحليل صورة موقع إنشائي. */
export async function analyzeImage(args: {
  role: string;
  prompt: string;
  mediaType: ImageMediaType;
  base64: string;
  effort?: Effort;
}): Promise<string | null> {
  if (!hasApiKey()) return null;

  try {
    const res = await create({
      model: MODEL,
      max_tokens: 4000,
      system: systemPrompt(args.role),
      output_config: { effort: args.effort ?? "high" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: args.mediaType, data: args.base64 },
            },
            { type: "text", text: args.prompt },
          ],
        },
      ],
    } as CreateParams);

    return textOf(res);
  } catch (err) {
    console.error("[ai] analyzeImage failed:", err);
    return null;
  }
}
