/**
 * المحرك الاحتياطي المحلي.
 *
 * يعمل بلا اتصال ولا مفتاح API: مطابقة كلمات مفتاحية على قاعدة معرفة الشركة
 * لإجابات المحادثة، وقوالب مبنية على مدخلات المستخدم لنطاق العمل.
 * الهدف ألا يرى الزائر صفحة معطّلة في أي حال.
 */

import { company, faqs, guarantees, processSteps, projects, services } from "./company";
import { finishLevels, projectTypes, timelines, type EstimateResult } from "./estimator";
import { ar } from "./format";

const norm = (s: string) =>
  s
    .replace(/[ً-ْـ]/g, "") // إزالة التشكيل والتطويل
    .replace(/[إأآا]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[؟?!.,،:;"'()\[\]{}]/g, " ") // الترقيم يمنع مطابقة آخر كلمة في السؤال
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

type Entry = { keys: string[]; answer: string };

function buildIndex(): Entry[] {
  const entries: Entry[] = [];

  for (const f of faqs) entries.push({ keys: [f.q], answer: f.a });

  for (const s of services) {
    entries.push({
      keys: [s.title, s.short, ...s.points],
      answer: `${s.title}: ${s.description}\n\nأبرز البنود:\n${s.points.map((p) => `• ${p}`).join("\n")}`,
    });
  }

  for (const p of projects) {
    entries.push({
      keys: [p.title, p.category, p.city, String(p.year)],
      answer: `${p.title} — ${p.category} في ${p.city} (${p.year}).\n${p.summary}\nالمساحة ${p.area}، ومدة التنفيذ ${p.duration}. ${p.highlight}.`,
    });
  }

  // نوايا شائعة تُصاغ بعبارات كثيرة، فنمنحها مفاتيح صريحة بدل الاعتماد على نص الأسئلة الشائعة.
  entries.push({
    keys: [
      "كم تكلفة",
      "كم سعر",
      "كم يكلف",
      "تكلفة البناء",
      "تكلفة بناء فيلا",
      "سعر المتر",
      "سعر بناء",
      "ميزانية",
      "تكاليف",
      "اسعار",
    ],
    answer: `تتراوح تكلفة العظم بين ١,٠٥٠ و١,٣٠٠ ريال للمتر المربع، ومع التشطيب بين ١,٧٠٠ و٢,٩٠٠ ريال للمتر حسب مستوى التشطيب والمدينة.

مثال: فيلا ٥٠٠ م² بتشطيب قياسي في الرياض تقع عادةً في نطاق ١.٥ – ١.٩ مليون ريال شاملة الضريبة.

للحصول على رقم مخصص لمشروعك مع توزيع البنود وجدول الدفعات، استخدم حاسبة التكلفة الذكية في صفحة "منصة الذكاء". التقدير استرشادي ولا يُغني عن معاينة وجدول كميات.`,
  });

  entries.push({
    keys: [
      "كم مده",
      "كم يستغرق",
      "كم تستغرق",
      "مده التنفيذ",
      "مده البناء",
      "متى ينتهي",
      "الجدول الزمني",
      "وقت التنفيذ",
    ],
    answer: `المدد التقديرية للتنفيذ:
• فيلا ٤٠٠–٦٠٠ م²: ١٠–١٤ شهراً شاملة العظم والتشطيب.
• عمارة سكنية متوسطة: ١٦–٢٠ شهراً.
• مبنى تجاري: ٢٠–٢٦ شهراً.
• مستودع صناعي: ٩–١٢ شهراً.

تبدأ المدة من تاريخ تسليم الموقع، وتتأثر بمستوى التشطيب وسرعة اعتماد العيّنات من المالك.`,
  });

  entries.push({
    keys: ["ضمان", "ضمانات", "كفاله", "تأخير", "غرامه"],
    answer: `ضماناتنا:\n${guarantees.map((g) => `• ${g.title}: ${g.desc}`).join("\n")}`,
  });

  entries.push({
    keys: ["مراحل", "خطوات", "منهجيه", "كيف تعملون", "اجراءات", "بدايه"],
    answer: `منهجية العمل لدينا:\n${processSteps.map((s) => `${s.n} ${s.title} — ${s.desc}`).join("\n")}`,
  });

  entries.push({
    keys: ["تواصل", "رقم", "هاتف", "جوال", "واتساب", "بريد", "ايميل", "عنوان", "موقعكم", "دوام"],
    answer: `يمكنك التواصل معنا عبر:\n• الهاتف: ${company.phone}\n• واتساب: ${company.whatsapp}\n• البريد: ${company.email}\n• العنوان: ${company.address}\n• ساعات العمل: ${company.workingHours}`,
  });

  entries.push({
    keys: ["مدن", "مناطق", "اين تعملون", "تغطيه", "خارج الرياض"],
    answer: `ننفّذ مشاريعنا في: ${company.cities.join("، ")}. للمشاريع خارج هذه المدن يمكن دراسة الطلب حسب حجم المشروع.`,
  });

  entries.push({
    keys: ["من انتم", "عن الشركه", "تعريف", "خبره", "تاسست", "تصنيف"],
    answer: `${company.legalName} — ${company.tagline}.\nتأسست عام ${company.founded}، ${company.classification}، ونفّذت أكثر من ٣٤٠ مشروعاً بمسطحات تتجاوز ١.٨ مليون متر مربع في ${company.cities.join("، ")}.`,
  });

  return entries;
}

const INDEX = buildIndex();

/** إجابة محلية بالمطابقة على قاعدة المعرفة. */
export function localAnswer(question: string): string {
  const q = norm(question);
  const words = q.split(/\s+/).filter((w) => w.length > 2);

  let best: { score: number; answer: string } | null = null;

  for (const entry of INDEX) {
    let score = 0;
    for (const key of entry.keys) {
      const k = norm(key);
      // احتواء العبارة كاملة إشارة أقوى بكثير من تطابق كلمات متفرقة
      if (k.length > 3 && (q.includes(k) || k.includes(q))) score += 8;
      for (const w of words) if (k.includes(w)) score += 2;
      // المطابقة العكسية: كلمة دالّة من المفتاح تظهر في السؤال (مثل اسم خدمة داخل جملة)
      for (const kw of k.split(" ")) if (kw.length > 3 && q.includes(kw)) score += 2;
    }
    if (!best || score > best.score) best = { score, answer: entry.answer };
  }

  if (best && best.score >= 4) {
    return `${best.answer}\n\n(هذه إجابة من قاعدة معرفة الموقع. للحصول على رد مفصّل لحالتك، تواصل معنا على ${company.phone}.)`;
  }

  return `لم أجد إجابة دقيقة لسؤالك في قاعدة معرفة الموقع.

يسعدنا خدمتك مباشرة:
• الهاتف: ${company.phone}
• واتساب: ${company.whatsapp}
• البريد: ${company.email}

يمكنك أيضاً تجربة:
• حاسبة التكلفة الذكية لتقدير كلفة مشروعك خلال ثوانٍ.
• صفحة الخدمات للاطلاع على نطاق أعمالنا.`;
}

/** ملخص نصي محلي لنتيجة التقدير، يُستخدم حين يتعذّر الاتصال بالنموذج. */
export function localEstimateSummary(r: EstimateResult): {
  summary: string;
  recommendations: string[];
  risks: string[];
} {
  const t = projectTypes[r.input.projectType];

  const summary = `التكلفة التقديرية لمشروع ${t} بمساحة ${ar(r.input.area)} م² في ${r.input.city} تتراوح بين ${ar(r.low)} و${ar(r.high)} ريال شاملة ضريبة القيمة المضافة، بسعر متر يبلغ نحو ${ar(r.ratePerSqm)} ريال عند مستوى تشطيب ${finishLevels[r.input.finishLevel]}. المدة المتوقعة ${ar(r.months)} شهراً تقريباً (${ar(r.monthsLow)}–${ar(r.monthsHigh)} شهراً) بجدول ${timelines[r.input.timeline]}.`;

  const recommendations = [
    "اطلب معاينة ميدانية مجانية قبل اعتماد الميزانية — فحص التربة وحده قد يغيّر كلفة الأساسات بنسبة ملموسة.",
    "اعتمد عيّنات مواد التشطيب مبكراً؛ تأخير الاعتماد هو السبب الأول لتمدد الجدول الزمني.",
    "خصّص احتياطياً إضافياً بنسبة ٥٪ خارج العقد لمواجهة أوامر التغيير التي قد تطلبها لاحقاً.",
  ];

  if (r.input.timeline === "fast")
    recommendations.push("المسار السريع مجدٍ عند وجود التزام تعاقدي بموعد تسليم؛ وإلا فالجدول القياسي أوفر.");
  if (r.input.finishLevel === "luxury")
    recommendations.push("التشطيب الفاخر يستحق توريداً مبكراً للمواد المستوردة لتفادي مهل التوريد الطويلة.");
  if (r.input.basement)
    recommendations.push("القبو يتطلب دراسة تربة وتصميم ستائر ساندة قبل البدء؛ لا تُقدّر كلفته دون تقرير جيوتقني.");

  const risks = [
    "تقلب أسعار الحديد والأسمنت خلال فترة التنفيذ.",
    "احتمال اختلاف طبيعة التربة عن المفترض، ما يؤثر على تصميم وكلفة الأساسات.",
    "أوامر التغيير أثناء التنفيذ وأثرها على التكلفة والمدة.",
  ];

  if (r.input.projectType === "renovation")
    risks.push("المباني القائمة قد تُخفي عيوباً إنشائية لا تظهر إلا بعد أعمال الكشف والإزالة.");
  if (r.input.city !== "الرياض")
    risks.push("توفر العمالة والمواد خارج المدن الرئيسية قد يؤثر على الجدول الزمني.");

  return { summary, recommendations, risks };
}

/** قالب نطاق عمل محلي مبني على وصف المشروع. */
export function localScope(description: string, projectType: string, city: string): string {
  const svc = services.find((s) => description.includes(s.title)) ?? services[0];

  return `# نطاق العمل المبدئي

## ١. وصف المشروع
${description}

النوع: ${projectType} — الموقع: ${city}

## ٢. الأعمال المشمولة
${svc.points.map((p, i) => `${ar(i + 1)}. ${p}`).join("\n")}
${services
  .filter((s) => s.slug !== svc.slug)
  .slice(0, 2)
  .map((s) => `${s.points.length + 1}. ${s.points[0]}`)
  .join("\n")}

## ٣. الأعمال غير المشمولة
- رسوم الرخص البلدية وتوصيل الخدمات (كهرباء، مياه، صرف صحي).
- الأثاث والأجهزة والديكورات المتحركة.
- أي أعمال إضافية تُطلب خارج المخططات المعتمدة (تُعالج بأمر تغيير خطي).

## ٤. المراحل والتسليمات
${processSteps.map((s) => `- **${s.title}**: ${s.desc}`).join("\n")}

## ٥. الضمانات
${guarantees.map((g) => `- **${g.title}**: ${g.desc}`).join("\n")}

## ٦. ملاحظة
هذه وثيقة مبدئية استرشادية تُعدّ آلياً من وصف المشروع، ولا تُغني عن جدول كميات تفصيلي وعقد موقّع بعد المعاينة الميدانية.

للتواصل: ${company.phone} — ${company.email}`;
}
