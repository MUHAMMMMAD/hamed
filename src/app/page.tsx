import Link from "next/link";
import {
  ArrowLeft,
  Calculator,
  Camera,
  FileText,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { company, guarantees, processSteps, projects, services, stats } from "@/lib/company";
import { SectionHeading, ServiceIcon, StatBlock } from "@/components/ui";
import { plain } from "@/lib/format";

const aiTools = [
  {
    icon: Calculator,
    title: "حاسبة التكلفة الذكية",
    desc: "أدخل بيانات مشروعك واحصل على تقدير تكلفة مفصّل ببنوده وجدول دفعاته ومخاطره خلال ثوانٍ.",
    href: "/ai#estimator",
  },
  {
    icon: FileText,
    title: "مولّد نطاق العمل",
    desc: "اكتب فكرة مشروعك بلغتك، واستلم وثيقة نطاق عمل بمراحل وتسليمات وجدول كميات مبدئي.",
    href: "/ai#scope",
  },
  {
    icon: Camera,
    title: "تحليل صور المواقع",
    desc: "ارفع صورة من موقع البناء ليحلّلها الذكاء الاصطناعي: مرحلة الإنجاز وملاحظات السلامة والجودة.",
    href: "/ai#vision",
  },
  {
    icon: MessageSquare,
    title: "المساعد الذكي",
    desc: "استشارة فورية على مدار الساعة حول الأسعار والمدد والخدمات، بلغة عربية واضحة.",
    href: "/ai#assistant",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ===== الواجهة الرئيسية ===== */}
      <section className="relative overflow-hidden border-b border-ink-800">
        <div className="blueprint fade-radial absolute inset-0" aria-hidden="true" />
        <div
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-ochre-600 to-transparent"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-20 lg:px-8 lg:pb-32 lg:pt-28">
          <div className="grid items-center gap-16 lg:grid-cols-[1.15fr_1fr]">
            <div className="animate-rise">
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-ochre-600" />
                <span className="rule-label">
                  منذ {plain(company.founded)} — {company.classification}
                </span>
              </div>

              <h1 className="mt-7 text-4xl leading-[1.15] sm:text-5xl lg:text-6xl">
                <span className="text-mist-100">نبني المسار</span>
                <br />
                <span className="text-gradient">ونُتقن التشييد</span>
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-relaxed text-mist-300">
                شركة مقاولات سعودية تنفّذ المشاريع السكنية والتجارية والصناعية بعقد
                واضح، وسعر ثابت، وجدول زمني ملتزم — مدعومة بمنصة ذكاء اصطناعي تُقدّر
                تكلفة مشروعك وتُعدّ نطاق عمله قبل أن تلتقي بنا.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/ai"
                  className="group flex items-center gap-2.5 bg-ochre-500 px-7 py-3.5 font-bold text-ink-950 transition-colors hover:bg-ochre-400"
                >
                  قدّر تكلفة مشروعك مجاناً
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                </Link>
                <Link
                  href="/projects"
                  className="border border-ink-600 px-7 py-3.5 text-mist-200 transition-colors hover:border-ochre-500 hover:text-ochre-400"
                >
                  تصفّح مشاريعنا
                </Link>
              </div>

              <p className="mt-8 flex items-center gap-2.5 text-sm text-mist-400">
                <ShieldCheck className="h-4 w-4 text-ochre-500" />
                ضمان هيكلي ١٠ سنوات • سعر ثابت لا يتغيّر • غرامة تأخير على المقاول
              </p>
            </div>

            {/* بطاقة مرئية: مقطع رمزي لمبنى بأدوار متدرجة */}
            <div className="relative hidden lg:block">
              <div className="corner-mark relative border border-ink-700 bg-ink-900/60 p-8">
                <div className="blueprint-fine absolute inset-0 opacity-60" aria-hidden="true" />
                <div className="relative space-y-3">
                  {[
                    { w: "100%", label: "الأساسات والقواعد", pct: "١٠٠٪" },
                    { w: "92%", label: "الهيكل الخرساني", pct: "٩٢٪" },
                    { w: "74%", label: "أعمال البناء والعزل", pct: "٧٤٪" },
                    { w: "58%", label: "الكهرباء والسباكة", pct: "٥٨٪" },
                    { w: "31%", label: "التشطيبات الداخلية", pct: "٣١٪" },
                    { w: "12%", label: "الواجهات الخارجية", pct: "١٢٪" },
                  ].map((row, i) => (
                    <div key={row.label} className="group">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-mist-300">{row.label}</span>
                        <span className="nums-ar text-ochre-400">{row.pct}</span>
                      </div>
                      <div className="h-2 bg-ink-800">
                        <div
                          className="h-full bg-gradient-to-l from-ochre-500 to-ochre-700"
                          style={{ width: row.w, animationDelay: `${i * 80}ms` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="relative mt-7 border-t border-ink-700 pt-5">
                  <p className="text-xs text-mist-500">نموذج تقرير إنجاز أسبوعي</p>
                  <p className="mt-1.5 text-sm text-mist-200">
                    يصل المالك كل خميس موثّقاً بالصور ونسب الإنجاز المعتمدة.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== شريط الأرقام ===== */}
      <section className="border-b border-ink-800 bg-ink-900">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 py-12 lg:grid-cols-4 lg:px-8">
          {stats.map((s) => (
            <StatBlock key={s.label} value={s.value} label={s.label} />
          ))}
        </div>
      </section>

      {/* ===== منصة الذكاء الاصطناعي ===== */}
      <section className="relative overflow-hidden border-b border-ink-800 py-24">
        <div className="blueprint-fine absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            label="ما يميّزنا"
            title="أول مقاول سعودي يضع الذكاء الاصطناعي بين يديك"
            intro="لا تنتظر أسبوعاً لتعرف كلفة مشروعك. أدواتنا الأربع تعطيك تقديراً هندسياً ووثيقة نطاق عمل وتحليلاً لموقعك — الآن، ومجاناً، وقبل أن توقّع أي شيء."
          />

          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {aiTools.map((tool, i) => (
              <Link
                key={tool.title}
                href={tool.href}
                className="panel panel-hover corner-mark group relative animate-rise p-7"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span className="flex h-12 w-12 items-center justify-center border border-ochre-600/40 bg-ochre-500/10 text-ochre-400">
                  <tool.icon className="h-5.5 w-5.5" />
                </span>
                <h3 className="mt-6 text-lg text-mist-100">{tool.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mist-400">{tool.desc}</p>
                <span className="mt-6 flex items-center gap-2 text-sm text-ochre-400">
                  جرّبها الآن
                  <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== الخدمات ===== */}
      <section className="border-b border-ink-800 py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            label="خدماتنا"
            title="من فكرة على ورق إلى مبنى يُسلَّم بالمفتاح"
            intro="ستة مسارات تغطي دورة حياة المشروع كاملة، بمسؤولية عقدية واحدة وفريق موقع واحد."
          />

          <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <Link
                key={s.slug}
                href={`/services#${s.slug}`}
                className="panel panel-hover group flex flex-col p-7"
              >
                <ServiceIcon name={s.icon} className="h-7 w-7 text-ochre-500" />
                <h3 className="mt-6 text-lg text-mist-100">{s.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-mist-400">{s.short}</p>
                <span className="mt-6 flex items-center gap-2 text-sm text-mist-500 transition-colors group-hover:text-ochre-400">
                  التفاصيل
                  <ArrowLeft className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== مشاريع مختارة ===== */}
      <section className="border-b border-ink-800 bg-ink-900 py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              align="start"
              label="أعمالنا"
              title="مشاريع سلّمناها"
              intro="نماذج من ٣٤٠ مشروعاً منجزاً في ست مدن سعودية."
            />
            <Link
              href="/projects"
              className="flex items-center gap-2 border border-ink-600 px-6 py-3 text-sm text-mist-200 transition-colors hover:border-ochre-500 hover:text-ochre-400"
            >
              كل المشاريع
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 3).map((p) => (
              <Link
                key={p.slug}
                href={`/projects#${p.slug}`}
                className="panel panel-hover group overflow-hidden"
              >
                <div className={`relative h-44 bg-gradient-to-bl ${p.gradient}`}>
                  <div className="blueprint-fine absolute inset-0" aria-hidden="true" />
                  <span className="absolute right-4 top-4 bg-ink-950/80 px-3 py-1 text-xs text-ochre-400">
                    {p.category}
                  </span>
                  <span className="nums-ar absolute bottom-4 left-4 text-xs text-mist-400">
                    {plain(p.year)}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-lg text-mist-100">{p.title}</h3>
                  <p className="mt-2 text-sm text-mist-500">
                    {p.city} • {p.area} • {p.duration}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-mist-400">{p.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== منهجية العمل ===== */}
      <section className="border-b border-ink-800 py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            label="كيف نعمل"
            title="خمس مراحل، بلا مفاجآت"
            intro="كل مرحلة لها مخرج واضح تستلمه وتعتمده قبل الانتقال للتي تليها."
          />

          <div className="mt-16 grid gap-px overflow-hidden border border-ink-700 bg-ink-700 md:grid-cols-3 lg:grid-cols-5">
            {processSteps.map((s) => (
              <div key={s.n} className="group bg-ink-950 p-7 transition-colors hover:bg-ink-900">
                <span className="nums-ar font-display text-3xl font-bold text-ink-600 transition-colors group-hover:text-ochre-500">
                  {s.n}
                </span>
                <h3 className="mt-4 text-base text-mist-100">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mist-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== الضمانات ===== */}
      <section className="border-b border-ink-800 bg-ink-900 py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            label="التزاماتنا"
            title="ما نضعه في العقد، لا في الإعلان"
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

      {/* ===== دعوة للتواصل ===== */}
      <section className="relative overflow-hidden py-24">
        <div className="blueprint fade-radial absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-5 text-center lg:px-8">
          <h2 className="text-3xl sm:text-4xl">
            <span className="text-mist-100">جاهز لتبدأ؟ </span>
            <span className="text-gradient">ابدأ بالرقم.</span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-mist-300">
            قدّر تكلفة مشروعك بنفسك خلال دقيقة، أو اطلب معاينة ميدانية مجانية
            ويصلك عرض سعر تفصيلي خلال ٤٨ ساعة.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/ai#estimator"
              className="group flex items-center gap-2.5 bg-ochre-500 px-8 py-4 font-bold text-ink-950 transition-colors hover:bg-ochre-400"
            >
              احسب التكلفة الآن
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </Link>
            <Link
              href="/contact"
              className="border border-ink-600 px-8 py-4 text-mist-200 transition-colors hover:border-ochre-500 hover:text-ochre-400"
            >
              اطلب معاينة مجانية
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
