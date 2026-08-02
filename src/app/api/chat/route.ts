import { NextRequest } from "next/server";
import { z } from "zod";
import { streamText } from "@/lib/ai";
import { localAnswer } from "@/lib/fallback";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(24),
});

const ROLE =
  "الرد على استفسارات العملاء حول خدمات الشركة، أسعار البناء التقريبية، المدد الزمنية، الضمانات، ومراحل التنفيذ. أنت واجهة الشركة الأولى مع العميل.";

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return Response.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const stream = streamText({
    role: ROLE,
    messages: parsed.messages,
    effort: "low",
    maxTokens: 1500,
  });

  // بلا مفتاح API: نبث إجابة قاعدة المعرفة المحلية بنفس الشكل حتى تبقى الواجهة موحّدة.
  if (!stream) {
    const last = parsed.messages.filter((m) => m.role === "user").at(-1);
    const answer = localAnswer(last?.content ?? "");
    return new Response(answer, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Engine": "local" },
    });
  }

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Engine": "ai",
    },
  });
}
