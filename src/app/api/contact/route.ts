import { NextRequest } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  name: z.string().min(2, "الاسم قصير جداً").max(80),
  phone: z
    .string()
    .min(9, "رقم الجوال غير صالح")
    .max(20)
    .regex(/^[+\d\s()-]+$/, "رقم الجوال غير صالح"),
  email: z.string().email("البريد الإلكتروني غير صالح").max(120).optional().or(z.literal("")),
  city: z.string().min(2).max(40),
  service: z.string().min(2).max(60),
  message: z.string().min(10, "اكتب تفاصيل أوضح عن مشروعك").max(3000),
});

export async function POST(req: NextRequest) {
  let data;
  try {
    data = bodySchema.parse(await req.json());
  } catch (err) {
    const issue = err instanceof z.ZodError ? err.issues[0]?.message : null;
    return Response.json({ error: issue ?? "تحقق من البيانات المدخلة" }, { status: 400 });
  }

  // نقطة الربط بمزوّد البريد أو نظام CRM.
  // تُترك مقصودةً بلا إرسال فعلي حتى تُضاف بيانات اعتماد المزوّد.
  console.info("[contact] طلب جديد", {
    name: data.name,
    phone: data.phone,
    city: data.city,
    service: data.service,
    at: new Date().toISOString(),
  });

  return Response.json({
    ok: true,
    message: `شكراً ${data.name}. استلمنا طلبك وسيتواصل معك فريقنا خلال ٢٤ ساعة عمل.`,
  });
}
