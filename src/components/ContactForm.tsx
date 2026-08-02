"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { company, services } from "@/lib/company";

const INPUT =
  "w-full bg-ink-800 px-3.5 py-2.5 text-sm text-mist-100 outline-none placeholder:text-mist-500 focus:ring-1 focus:ring-inset focus:ring-ochre-600";

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    // التحويل الصريح يمنع تثبيت النوع على أول مدينة بسبب as const في بيانات الشركة
    city: company.cities[0] as string,
    service: services[0].title,
    message: "",
  });
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "تعذّر إرسال الطلب");
      setConfirmation(data.message);
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="panel corner-mark relative flex min-h-96 flex-col items-center justify-center p-10 text-center">
        <CheckCircle2 className="h-14 w-14 text-ochre-500" />
        <h3 className="mt-6 text-2xl text-mist-100">تم استلام طلبك</h3>
        <p className="mt-4 max-w-sm leading-relaxed text-mist-300">{confirmation}</p>
        <button
          type="button"
          onClick={() => {
            setForm({ ...form, message: "" });
            setState("idle");
          }}
          className="mt-8 border border-ink-600 px-6 py-3 text-sm text-mist-200 transition-colors hover:border-ochre-500 hover:text-ochre-400"
        >
          إرسال طلب آخر
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="panel space-y-5 p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="الاسم الكامل" required>
          <input
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={INPUT}
          />
        </Field>

        <Field label="رقم الجوال" required>
          <input
            type="tel"
            required
            dir="ltr"
            placeholder="+966 5X XXX XXXX"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={`${INPUT} nums-ar text-right`}
          />
        </Field>
      </div>

      <Field label="البريد الإلكتروني (اختياري)">
        <input
          type="email"
          dir="ltr"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={`${INPUT} text-right`}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="المدينة" required>
          <select
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className={INPUT}
          >
            {company.cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="الخدمة المطلوبة" required>
          <select
            value={form.service}
            onChange={(e) => setForm({ ...form, service: e.target.value })}
            className={INPUT}
          >
            {services.map((s) => (
              <option key={s.slug} value={s.title}>
                {s.title}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="تفاصيل المشروع" required>
        <textarea
          rows={5}
          required
          minLength={10}
          maxLength={3000}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="المساحة، عدد الأدوار، مستوى التشطيب، الموعد المستهدف للبدء، وأي متطلبات خاصة..."
          className={`${INPUT} resize-none leading-relaxed`}
        />
      </Field>

      <button
        type="submit"
        disabled={state === "busy"}
        className="flex w-full items-center justify-center gap-2.5 bg-ochre-500 py-4 font-bold text-ink-950 transition-colors hover:bg-ochre-400 disabled:opacity-60"
      >
        {state === "busy" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            جارٍ الإرسال...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 rotate-180" />
            أرسل الطلب
          </>
        )}
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <p className="text-xs leading-relaxed text-mist-500">
        بإرسالك الطلب توافق على تواصل فريقنا معك بخصوص مشروعك. لا نشارك بياناتك
        مع أي جهة خارجية.
      </p>

    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs text-mist-400">
        {label}
        {required && <span className="mr-1 text-ochre-500">*</span>}
      </span>
      {children}
    </label>
  );
}
