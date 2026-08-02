import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import { company, processSteps } from "@/lib/company";

export const metadata: Metadata = {
  title: "تواصل معنا",
  description:
    "اطلب عرض سعر أو معاينة ميدانية مجانية من شركة مسارات التشييد للمقاولات — الرياض، جدة، الدمام، القصيم، أبها، المدينة المنورة.",
};

export default function ContactPage() {
  const tel = company.phone.replace(/\s/g, "");
  const wa = company.whatsapp.replace(/[\s+]/g, "");

  return (
    <>
      <section className="relative overflow-hidden border-b border-ink-800 py-20">
        <div className="blueprint fade-radial absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-3xl">
            <span className="rule-label">تواصل معنا</span>
            <h1 className="mt-6 text-4xl sm:text-5xl">
              <span className="text-mist-100">اطلب </span>
              <span className="text-gradient">معاينة مجانية</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-mist-300">
              أرسل تفاصيل مشروعك ويتواصل معك مهندس من فريقنا خلال ٢٤ ساعة عمل
              لتحديد موعد المعاينة. عرض السعر التفصيلي يصلك خلال ٤٨ ساعة من
              المعاينة.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-[1fr_1.4fr] lg:px-8">
          {/* ===== بيانات التواصل ===== */}
          <div className="space-y-6">
            <div className="panel p-8">
              <h2 className="text-xl text-mist-100">بيانات التواصل</h2>
              <ul className="mt-7 space-y-6">
                <ContactRow icon={Phone} label="الهاتف">
                  <a href={`tel:${tel}`} dir="ltr" className="nums-ar hover:text-ochre-400">
                    {company.phone}
                  </a>
                </ContactRow>

                <ContactRow icon={MessageCircle} label="واتساب">
                  <a
                    href={`https://wa.me/${wa}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    dir="ltr"
                    className="nums-ar hover:text-ochre-400"
                  >
                    {company.whatsapp}
                  </a>
                </ContactRow>

                <ContactRow icon={Mail} label="البريد الإلكتروني">
                  <a href={`mailto:${company.email}`} dir="ltr" className="hover:text-ochre-400">
                    {company.email}
                  </a>
                </ContactRow>

                <ContactRow icon={MapPin} label="العنوان">
                  <span className="leading-relaxed">{company.address}</span>
                </ContactRow>

                <ContactRow icon={Clock} label="ساعات العمل">
                  <span>{company.workingHours}</span>
                </ContactRow>
              </ul>
            </div>

            <div className="panel corner-mark relative p-8">
              <h3 className="text-lg text-mist-100">ماذا يحدث بعد إرسال طلبك؟</h3>
              <ol className="mt-6 space-y-5">
                {processSteps.slice(0, 3).map((s) => (
                  <li key={s.n} className="flex gap-4">
                    <span className="nums-ar font-display text-lg font-bold text-ochre-600">
                      {s.n}
                    </span>
                    <div>
                      <p className="text-mist-100">{s.title}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-mist-400">{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="panel bg-ochre-500/5 p-8">
              <p className="leading-relaxed text-mist-200">
                تريد رقماً قبل أن تتواصل؟ استخدم{" "}
                <a href="/ai#estimator" className="text-ochre-400 underline underline-offset-4">
                  حاسبة التكلفة الذكية
                </a>{" "}
                واحصل على تقدير مفصّل لمشروعك خلال دقيقة.
              </p>
            </div>
          </div>

          {/* ===== النموذج ===== */}
          <ContactForm />
        </div>
      </section>
    </>
  );
}

function ContactRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-ink-700 text-ochre-500">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xs text-mist-500">{label}</p>
        <div className="mt-1.5 text-mist-200">{children}</div>
      </div>
    </li>
  );
}
