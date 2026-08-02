import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import Logo from "./Logo";
import { company, services } from "@/lib/company";
import { plain } from "@/lib/format";

const quickLinks = [
  { href: "/services", label: "الخدمات" },
  { href: "/projects", label: "المشاريع" },
  { href: "/ai", label: "منصة الذكاء الاصطناعي" },
  { href: "/about", label: "عن الشركة" },
  { href: "/contact", label: "تواصل معنا" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-ink-800 bg-ink-900">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-mist-400">
              {company.tagline} — ننفّذ مشاريع المقاولات العامة والتصميم والتنفيذ
              والتشطيبات منذ عام {plain(company.founded)}.
            </p>
            <p className="mt-4 text-xs text-mist-500">{company.classification}</p>
          </div>

          <div>
            <h3 className="mb-5 text-sm font-bold text-mist-100">الخدمات</h3>
            <ul className="space-y-3">
              {services.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/services#${s.slug}`}
                    className="text-sm text-mist-400 transition-colors hover:text-ochre-400"
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-sm font-bold text-mist-100">روابط سريعة</h3>
            <ul className="space-y-3">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-mist-400 transition-colors hover:text-ochre-400"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-sm font-bold text-mist-100">تواصل معنا</h3>
            <ul className="space-y-4 text-sm text-mist-400">
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-ochre-500" />
                <a
                  href={`tel:${company.phone.replace(/\s/g, "")}`}
                  dir="ltr"
                  className="nums-ar hover:text-ochre-400"
                >
                  {company.phone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-ochre-500" />
                <a href={`mailto:${company.email}`} dir="ltr" className="hover:text-ochre-400">
                  {company.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ochre-500" />
                <span className="leading-relaxed">{company.address}</span>
              </li>
            </ul>
            <p className="mt-5 text-xs text-mist-500">{company.workingHours}</p>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-ink-800 pt-7 text-xs text-mist-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {plain(new Date().getFullYear())} {company.legalName}. جميع الحقوق محفوظة.
          </p>
          <p className="nums-ar">
            س.ت {company.crNumber} — الرقم الضريبي {company.vatNumber}
          </p>
        </div>
      </div>
    </footer>
  );
}
