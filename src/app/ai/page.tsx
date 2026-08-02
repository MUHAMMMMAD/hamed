import type { Metadata } from "next";
import { Calculator, Camera, FileText, MessageSquare, Sparkles } from "lucide-react";
import EstimatorTool from "@/components/EstimatorTool";
import ScopeTool from "@/components/ScopeTool";
import VisionTool from "@/components/VisionTool";
import { SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "منصة الذكاء الاصطناعي",
  description:
    "حاسبة تكلفة البناء الذكية، مولّد نطاق العمل، وتحليل صور مواقع البناء — أدوات مجانية من مسارات التشييد تعمل بالذكاء الاصطناعي.",
};

const nav = [
  { id: "estimator", icon: Calculator, label: "حاسبة التكلفة" },
  { id: "scope", icon: FileText, label: "مولّد نطاق العمل" },
  { id: "vision", icon: Camera, label: "تحليل صور المواقع" },
  { id: "assistant", icon: MessageSquare, label: "المساعد الذكي" },
];

export default function AiPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-ink-800 py-20">
        <div className="blueprint fade-radial absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-ochre-500" />
              <span className="rule-label">منصة الذكاء الاصطناعي</span>
            </div>
            <h1 className="mt-6 text-4xl sm:text-5xl">
              <span className="text-mist-100">أدوات تعطيك الأرقام </span>
              <span className="text-gradient">قبل أن تلتقي بنا</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-mist-300">
              أربع أدوات مجانية بلا تسجيل: قدّر التكلفة، وولّد وثيقة نطاق العمل،
              وحلّل صور موقعك، واسأل المساعد. كل أداة تعمل على قاعدة معرفة الشركة
              ومحرك تقدير هندسي، لا على تخمينات عامة.
            </p>
          </div>

          <nav className="mt-12 flex flex-wrap gap-3">
            {nav.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                className="flex items-center gap-2.5 border border-ink-600 px-5 py-3 text-sm text-mist-200 transition-colors hover:border-ochre-500 hover:text-ochre-400"
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* ===== حاسبة التكلفة ===== */}
      <section id="estimator" className="scroll-mt-24 border-b border-ink-800 py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            align="start"
            label="الأداة الأولى"
            title="حاسبة التكلفة الذكية"
            intro="محرك تقدير هندسي يحسب الأرقام، وذكاء اصطناعي يقرأها لك: توزيع البنود، جدول الدفعات، المخاطر، وفرص التوفير."
          />
          <div className="mt-12">
            <EstimatorTool />
          </div>
        </div>
      </section>

      {/* ===== مولّد نطاق العمل ===== */}
      <section id="scope" className="scroll-mt-24 border-b border-ink-800 bg-ink-900 py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            align="start"
            label="الأداة الثانية"
            title="مولّد نطاق العمل"
            intro="اكتب فكرة مشروعك بلغتك العادية، واستلم وثيقة نطاق عمل بالأعمال المشمولة وغير المشمولة والمراحل والتسليمات وجدول كميات مبدئي — قابلة للتحميل."
          />
          <div className="mt-12">
            <ScopeTool />
          </div>
        </div>
      </section>

      {/* ===== تحليل الصور ===== */}
      <section id="vision" className="scroll-mt-24 border-b border-ink-800 py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            align="start"
            label="الأداة الثالثة"
            title="تحليل صور مواقع البناء"
            intro="ارفع صورة من موقعك ليفحصها الذكاء الاصطناعي بصرياً: مرحلة الإنجاز، ملاحظات السلامة، جودة التنفيذ الظاهرة، وتوصيات المتابعة."
          />
          <div className="mt-12">
            <VisionTool />
          </div>
        </div>
      </section>

      {/* ===== المساعد الذكي ===== */}
      <section id="assistant" className="scroll-mt-24 bg-ink-900 py-20">
        <div className="mx-auto max-w-3xl px-5 text-center lg:px-8">
          <SectionHeading
            label="الأداة الرابعة"
            title="المساعد الذكي"
            intro="استشارة فورية على مدار الساعة: الأسعار التقريبية، المدد الزمنية، الخدمات، الضمانات، ومراحل التنفيذ."
          />
          <div className="panel corner-mark relative mx-auto mt-12 max-w-lg p-10">
            <MessageSquare className="mx-auto h-10 w-10 text-ochre-500" />
            <p className="mt-6 leading-relaxed text-mist-300">
              اضغط على أيقونة المحادثة في الزاوية السفلية من الشاشة لبدء الحوار
              مع المساعد الذكي.
            </p>
            <p className="mt-4 text-sm text-mist-500">
              يجيب بالعربية، ويستند إلى بيانات الشركة الفعلية دون تخمين.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
