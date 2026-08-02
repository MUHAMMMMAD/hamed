import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { company, guarantees, processSteps, stats } from "@/lib/company";
import { SectionHeading, StatBlock } from "@/components/ui";
import { ordinal, plain } from "@/lib/format";

export const metadata: Metadata = {
  title: "عن الشركة",
  description:
    "شركة مسارات التشييد للمقاولات: تأسست عام ٢٠٠٩، مصنّفة الدرجة الثالثة مباني، ونفّذت أكثر من ٣٤٠ مشروعاً في ست مدن سعودية.",
};

const values = [
  {
    title: "الرقم قبل الوعد",
    desc: "نعطي العميل تقديراً مبنياً على جدول كميات لا على انطباع. وما نكتبه في العقد هو ما ننفّذه.",
  },
  {
    title: "مسؤولية واحدة",
    desc: "فريق موقع واحد ومسؤولية عقدية واحدة، فلا يجد المالك نفسه وسيطاً بين مصمم ومقاول ومورّد.",
  },
  {
    title: "التوثيق عادة لا استثناء",
    desc: "تقارير أسبوعية بالصور، اختبارات جودة موثّقة، ومستخلصات مرتبطة بنسب إنجاز معتمدة.",
  },
  {
    title: "السلامة غير قابلة للتفاوض",
    desc: "خطة سلامة معتمدة لكل موقع، ومعدات وقاية إلزامية، وتفتيش دوري موثّق.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-ink-800 py-20">
        <div className="blueprint fade-radial absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-3xl">
            <span className="rule-label">عن الشركة</span>
            <h1 className="mt-6 text-4xl sm:text-5xl">
              <span className="text-mist-100">{company.legalName.replace("شركة ", "")} </span>
              <br />
              <span className="text-gradient">{company.tagline}</span>
            </h1>
            <p className="mt-7 text-lg leading-relaxed text-mist-300">
              بدأنا عام {plain(company.founded)} بفريق صغير ومشروع سكني واحد في الرياض. اليوم،
              وبعد أكثر من {plain(new Date().getFullYear() - company.founded)} عاماً، سلّمنا
              أكثر من ٣٤٠ مشروعاً بمسطحات تتجاوز ١.٨ مليون متر مربع في{" "}
              {company.cities.join("، ")} — ولم يتغيّر ما بدأنا به: عقد واضح، سعر
              ثابت، وموعد تسليم يُحترم.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-ink-800 bg-ink-900">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 py-12 lg:grid-cols-4 lg:px-8">
          {stats.map((s) => (
            <StatBlock key={s.label} value={s.value} label={s.label} />
          ))}
        </div>
      </section>

      <section className="border-b border-ink-800 py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-2">
            <div className="panel corner-mark relative p-9">
              <span className="rule-label">رسالتنا</span>
              <p className="mt-6 text-xl leading-relaxed text-mist-200">
                أن نجعل قرار البناء قراراً واضحاً: يعرف صاحبه كم يدفع، ومتى يستلم،
                وما الذي يستلمه بالضبط — قبل أن تُصبّ أول قاعدة.
              </p>
            </div>

            <div className="panel corner-mark relative p-9">
              <span className="rule-label">رؤيتنا</span>
              <p className="mt-6 text-xl leading-relaxed text-mist-200">
                أن نكون المقاول الذي يقيس أثره بعدد المشاريع المسلّمة في موعدها،
                لا بعدد المشاريع الموقّعة — وأن نُدخل أدوات العصر إلى قطاع اعتاد
                على التقدير بالخبرة وحدها.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-ink-800 bg-ink-900 py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            label="قيمنا"
            title="أربعة مبادئ تحكم كل مشروع"
            intro="ليست شعارات — كل مبدأ منها يقابله إجراء موثّق في نظام إدارة المشاريع لدينا."
          />

          <div className="mt-16 grid gap-5 sm:grid-cols-2">
            {values.map((v, i) => (
              <div key={v.title} className="panel p-8">
                <span className="nums-ar font-display text-3xl font-bold text-ink-700">
                  {ordinal(i + 1)}
                </span>
                <h3 className="mt-4 text-lg text-mist-100">{v.title}</h3>
                <p className="mt-3 leading-relaxed text-mist-400">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-ink-800 py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            label="منهجية العمل"
            title="خمس مراحل، بلا مفاجآت"
            intro="كل مرحلة لها مخرج واضح تستلمه وتعتمده قبل الانتقال للتي تليها."
          />

          <div className="mt-16 space-y-px overflow-hidden border border-ink-700 bg-ink-700">
            {processSteps.map((s) => (
              <div
                key={s.n}
                className="grid gap-4 bg-ink-950 p-7 transition-colors hover:bg-ink-900 sm:grid-cols-[6rem_1fr_2fr] sm:items-baseline sm:gap-8"
              >
                <span className="nums-ar font-display text-3xl font-bold text-ochre-600">
                  {s.n}
                </span>
                <h3 className="text-lg text-mist-100">{s.title}</h3>
                <p className="leading-relaxed text-mist-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-ink-800 bg-ink-900 py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            label="التزاماتنا"
            title="ما نضعه في العقد"
            intro="كل بند أدناه مكتوب في عقودنا وقابل للمطالبة به قانوناً."
          />

          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {guarantees.map((g) => (
              <div key={g.title} className="panel corner-mark relative p-7">
                <ShieldCheck className="h-6 w-6 text-ochre-500" />
                <h3 className="mt-5 text-base text-mist-100">{g.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mist-400">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-5 text-center lg:px-8">
          <h2 className="text-3xl text-mist-100 sm:text-4xl">لنبدأ بالحديث عن مشروعك</h2>
          <p className="mt-5 text-lg leading-relaxed text-mist-400">
            معاينة ميدانية مجانية، وعرض سعر تفصيلي خلال ٤٨ ساعة من المعاينة.
          </p>
          <Link
            href="/contact"
            className="group mt-9 inline-flex items-center gap-2.5 bg-ochre-500 px-8 py-4 font-bold text-ink-950 transition-colors hover:bg-ochre-400"
          >
            اطلب معاينة مجانية
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>
      </section>
    </>
  );
}
