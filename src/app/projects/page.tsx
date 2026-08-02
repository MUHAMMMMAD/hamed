import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Award, Building2, Calendar, MapPin, Ruler } from "lucide-react";
import { company, projects, stats } from "@/lib/company";
import { StatBlock } from "@/components/ui";
import { plain } from "@/lib/format";

export const metadata: Metadata = {
  title: "المشاريع",
  description:
    "مشاريع منجزة لشركة مسارات التشييد: مجمعات سكنية، أبراج تجارية، مستودعات لوجستية، ومجمعات طبية وتعليمية في الرياض وجدة والدمام والقصيم.",
};

export default function ProjectsPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-ink-800 py-20">
        <div className="blueprint fade-radial absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-3xl">
            <span className="rule-label">أعمالنا</span>
            <h1 className="mt-6 text-4xl sm:text-5xl">
              <span className="text-mist-100">مشاريع </span>
              <span className="text-gradient">سلّمناها فعلاً</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-mist-300">
              نماذج مختارة من مشاريعنا المنجزة في {plain(company.cities.length)} مدن سعودية،
              بمساحات تمتد من ستة آلاف إلى أربعة وثلاثين ألف متر مربع.
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

      <section className="py-20">
        <div className="mx-auto max-w-7xl space-y-6 px-5 lg:px-8">
          {projects.map((p) => (
            <article
              key={p.slug}
              id={p.slug}
              className="panel panel-hover scroll-mt-24 overflow-hidden"
            >
              <div className="grid lg:grid-cols-[1fr_1.4fr]">
                <div className={`relative min-h-56 bg-gradient-to-bl ${p.gradient}`}>
                  <div className="blueprint-fine absolute inset-0" aria-hidden="true" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Building2 className="h-16 w-16 text-mist-100/12" />
                  </div>
                  <span className="absolute right-5 top-5 bg-ink-950/80 px-3 py-1.5 text-xs text-ochre-400">
                    {p.category}
                  </span>
                </div>

                <div className="p-8 lg:p-10">
                  <h2 className="text-2xl text-mist-100">{p.title}</h2>
                  <p className="mt-4 leading-relaxed text-mist-400">{p.summary}</p>

                  <div className="mt-7 grid grid-cols-2 gap-5 border-y border-ink-800 py-6 sm:grid-cols-4">
                    <Meta icon={MapPin} label="الموقع" value={p.city} />
                    <Meta icon={Ruler} label="المساحة" value={p.area} />
                    <Meta icon={Calendar} label="المدة" value={p.duration} />
                    <Meta icon={Award} label="سنة التسليم" value={plain(p.year)} />
                  </div>

                  <div className="mt-7 grid gap-7 sm:grid-cols-2">
                    <div>
                      <p className="rule-label">نطاق التنفيذ</p>
                      <ul className="mt-4 space-y-2.5">
                        {p.scope.map((x) => (
                          <li key={x} className="flex gap-3 text-sm text-mist-400">
                            <span className="mt-2 h-1 w-1 shrink-0 bg-ochre-600" />
                            {x}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="rule-label">العميل</p>
                      <p className="mt-4 text-sm text-mist-300">{p.client}</p>
                      <p className="rule-label mt-6">أبرز ما تحقق</p>
                      <p className="mt-4 border-r-2 border-ochre-600 pr-4 text-sm leading-relaxed text-mist-200">
                        {p.highlight}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-ink-800 bg-ink-900 py-20">
        <div className="mx-auto max-w-3xl px-5 text-center lg:px-8">
          <h2 className="text-3xl text-mist-100 sm:text-4xl">مشروعك قد يكون التالي</h2>
          <p className="mt-5 text-lg leading-relaxed text-mist-400">
            ابدأ بتقدير التكلفة خلال دقيقة، أو اطلب معاينة ميدانية مجانية.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link
              href="/ai#estimator"
              className="group flex items-center gap-2.5 bg-ochre-500 px-7 py-3.5 font-bold text-ink-950 transition-colors hover:bg-ochre-400"
            >
              قدّر تكلفة مشروعك
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </Link>
            <Link
              href="/contact"
              className="border border-ink-600 px-7 py-3.5 text-mist-200 transition-colors hover:border-ochre-500 hover:text-ochre-400"
            >
              تواصل معنا
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-2 text-xs text-mist-500">
        <Icon className="h-3.5 w-3.5 text-ochre-600" />
        {label}
      </p>
      <p className="nums-ar mt-2 text-sm text-mist-200">{value}</p>
    </div>
  );
}
