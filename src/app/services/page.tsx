import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { faqs, services } from "@/lib/company";
import { SectionHeading, ServiceIcon } from "@/components/ui";
import { ordinal } from "@/lib/format";

export const metadata: Metadata = {
  title: "الخدمات",
  description:
    "المقاولات العامة، التصميم والتنفيذ، التشطيبات والديكور، الترميم وإعادة التأهيل، إدارة المشاريع، والبنية التحتية — خدمات مسارات التشييد.",
};

export default function ServicesPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-ink-800 py-20">
        <div className="blueprint fade-radial absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-3xl">
            <span className="rule-label">خدماتنا</span>
            <h1 className="mt-6 text-4xl sm:text-5xl">
              <span className="text-mist-100">ستة مسارات </span>
              <span className="text-gradient">تغطي مشروعك كاملاً</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-mist-300">
              سواء كنت تملك أرضاً بيضاء أو مبنى يحتاج تأهيلاً، هناك مسار واضح
              لدينا يبدأ بالمعاينة وينتهي بالتسليم مع الضمان.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl space-y-6 px-5 lg:px-8">
          {services.map((s, i) => (
            <article
              key={s.slug}
              id={s.slug}
              className="panel corner-mark relative scroll-mt-24 p-8 lg:p-10"
            >
              <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
                <div>
                  <div className="flex items-center gap-4">
                    <span className="flex h-14 w-14 items-center justify-center border border-ochre-600/40 bg-ochre-500/10 text-ochre-400">
                      <ServiceIcon name={s.icon} className="h-6 w-6" />
                    </span>
                    <span className="nums-ar font-display text-4xl font-bold text-ink-700">
                      {ordinal(i + 1)}
                    </span>
                  </div>

                  <h2 className="mt-6 text-2xl text-mist-100">{s.title}</h2>
                  <p className="mt-4 leading-relaxed text-mist-400">{s.description}</p>

                  <Link
                    href="/contact"
                    className="group mt-7 inline-flex items-center gap-2 text-sm text-ochre-400"
                  >
                    اطلب هذه الخدمة
                    <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                  </Link>
                </div>

                <div className="border-r border-ink-700 pr-8 lg:pr-10">
                  <p className="rule-label">ما يشمله هذا المسار</p>
                  <ul className="mt-6 space-y-4">
                    {s.points.map((p) => (
                      <li key={p} className="flex gap-3.5 text-mist-300">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-ochre-500" />
                        <span className="leading-relaxed">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-ink-800 bg-ink-900 py-20">
        <div className="mx-auto max-w-4xl px-5 lg:px-8">
          <SectionHeading
            label="أسئلة متكررة"
            title="ما يسأله عملاؤنا عادةً"
            intro="ولمزيد من الأسئلة، المساعد الذكي متاح في الزاوية السفلية على مدار الساعة."
          />

          <div className="mt-14 divide-y divide-ink-800 border-y border-ink-800">
            {faqs.map((f) => (
              <details key={f.q} className="group py-6">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-mist-100">
                  <span className="text-lg leading-snug">{f.q}</span>
                  <span className="mt-1 shrink-0 text-ochre-500 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 leading-relaxed text-mist-400">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
