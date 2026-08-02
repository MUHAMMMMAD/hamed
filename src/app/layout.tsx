import type { Metadata, Viewport } from "next";
import "./globals.css";
import { company } from "@/lib/company";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ChatWidget from "@/components/ChatWidget";

export const metadata: Metadata = {
  metadataBase: new URL("https://masarat-altashyeed.com"),
  title: {
    default: `${company.name} | ${company.tagline}`,
    template: `%s | ${company.name}`,
  },
  description:
    "شركة مسارات التشييد للمقاولات — تنفيذ المشاريع السكنية والتجارية والصناعية في السعودية، مع منصة ذكاء اصطناعي لتقدير التكلفة وإعداد نطاق العمل وتحليل مواقع البناء.",
  keywords: [
    "مقاولات",
    "شركة مقاولات",
    "بناء فلل",
    "تشطيبات",
    "مقاول الرياض",
    "تكلفة البناء",
    "حاسبة تكلفة البناء",
    "ترميم مباني",
  ],
  authors: [{ name: company.legalName }],
  openGraph: {
    type: "website",
    locale: "ar_SA",
    siteName: company.name,
    title: `${company.name} | ${company.tagline}`,
    description:
      "مقاولات عامة، تصميم وتنفيذ، تشطيبات وترميم — مدعومة بأدوات ذكاء اصطناعي تقدّر التكلفة وتُعدّ نطاق العمل خلال ثوانٍ.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#080a0e",
  width: "device-width",
  initialScale: 1,
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "GeneralContractor",
  name: company.legalName,
  alternateName: company.nameEn,
  slogan: company.tagline,
  foundingDate: String(company.founded),
  telephone: company.phone,
  email: company.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: company.address,
    addressCountry: "SA",
  },
  areaServed: company.cities,
  openingHours: "Su-Th 08:00-17:00",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* تُحمّل الخطوط من المتصفح لا وقت البناء، حتى لا يفشل البناء في بيئة بلا شبكة */}
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&family=IBM+Plex+Sans+Arabic:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body className="min-h-dvh flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <ChatWidget />
      </body>
    </html>
  );
}
