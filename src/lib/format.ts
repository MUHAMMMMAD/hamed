/**
 * تنسيق الأرقام.
 *
 * الموقع عربي بالكامل، فأي رقم يُعرض بالأرقام اللاتينية بجوار رقم عربي-هندي
 * يبدو كخلل بصري. كل الأرقام الظاهرة للمستخدم تمر من هنا.
 */

const LOCALE = "ar-SA";

/** رقم بالأرقام العربية-الهندية مع فواصل الآلاف. */
export const ar = (n: number): string => n.toLocaleString(LOCALE);

/** مبلغ بالريال. */
export const sar = (n: number): string => `${ar(n)} ريال`;

/** نسبة مئوية من كسر عشري (0.26 ← ٢٦٪). */
export const pct = (fraction: number): string => `${ar(Math.round(fraction * 100))}٪`;

/** رقم بلا فواصل آلاف — للسنوات وأرقام العدّ (٢٠٢٤ لا ٢٬٠٢٤). */
export const plain = (n: number): string => n.toLocaleString(LOCALE, { useGrouping: false });

/** كسر عشري بخانتين (1.04 ← ١٫٠٤). */
export const decimal = (n: number, digits = 2): string =>
  n.toLocaleString(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** رقم تسلسلي بخانتين للعناوين المرقّمة (١ ← ٠١). */
export const ordinal = (n: number): string => {
  const digits = ar(n);
  return digits.length < 2 ? `٠${digits}` : digits;
};
