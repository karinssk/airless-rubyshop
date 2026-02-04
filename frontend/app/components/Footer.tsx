import React from "react";
import { resolveUploadUrl } from "@/lib/urls";

type FooterLink = {
  id?: string;
  label?: string;
  href?: string;
};

type FooterSocial = {
  id?: string;
  label?: string;
  href?: string;
  icon?: string;
};

type FooterContact = {
  id?: string;
  label?: string;
  value?: string;
  href?: string;
  icon?: string;
};

type FooterData = {
  backgroundColor?: string;
  brand?: {
    name?: string;
    description?: string;
    logoUrl?: string;
  };
  social?: FooterSocial[];
  services?: FooterLink[];
  menu?: FooterLink[];
  contact?: FooterContact[];
  copyright?: string;
  subfooter?: string;
};

const safeText = (value?: string) => (value ? String(value) : "");
const fallbackLogo = "/uploads/logo/rubyshop-no-bg-250pxx100px.jpg";
const fallbackBrand = "RUBYSHOP เทคโนโลยีเครื่องมือช่าง";

export default function Footer({ footer }: { footer: FooterData }) {
  const backgroundStyle = safeText(footer.backgroundColor)
    ? { backgroundColor: safeText(footer.backgroundColor) }
    : undefined;

  return (
    <footer className="text-white" style={backgroundStyle}>
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[1.2fr_1fr_1fr_1.1fr]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {footer.brand?.logoUrl || fallbackLogo ? (
              <img
                src={resolveUploadUrl(safeText(footer.brand?.logoUrl) || fallbackLogo)}
                alt={safeText(footer.brand?.name) || fallbackBrand}
                className="h-10 w-10 rounded-full bg-white p-1"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-white/10" />
            )}
            <p className="text-lg font-semibold">
              {safeText(footer.brand?.name) || fallbackBrand}
            </p>
          </div>
          <p className="text-sm text-white/80">
            {safeText(footer.brand?.description)}
          </p>
          <div className="flex flex-wrap gap-3">
            {(footer.social || []).map((item) => (
              <a
                key={item.id || item.label}
                href={safeText(item.href) || "#"}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
                aria-label={safeText(item.label)}
              >
                {item.icon ? (
                  <img
                    src={resolveUploadUrl(safeText(item.icon))}
                    alt=""
                    className="h-4 w-4 brightness-0 invert"
                  />
                ) : (
                  <span className="text-xs">•</span>
                )}
              </a>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold">บริการของเรา</p>
          <ul className="mt-4 grid gap-2 text-sm text-white/80">
            {(footer.services || []).map((item) => (
              <li key={item.id || item.label}>
                <a href={safeText(item.href) || "#"} className="hover:text-white">
                  {safeText(item.label)}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold">เมนูหลัก</p>
          <ul className="mt-4 grid gap-2 text-sm text-white/80">
            {(footer.menu || []).map((item) => (
              <li key={item.id || item.label}>
                <a href={safeText(item.href) || "#"} className="hover:text-white">
                  {safeText(item.label)}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold">ติดต่อเรา</p>
          <ul className="mt-4 grid gap-3 text-sm text-white/80">
            {(footer.contact || []).map((item) => (
              <li key={item.id || item.label} className="flex items-start gap-2">
                <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                  {item.icon ? (
                    <img
                      src={resolveUploadUrl(safeText(item.icon))}
                      alt=""
                      className="h-3.5 w-3.5 brightness-0 invert"
                    />
                  ) : (
                    <span className="text-[10px]">•</span>
                  )}
                </span>
                <div>
                  <a
                    href={safeText(item.href) || "#"}
                    className="block hover:text-white"
                  >
                    {safeText(item.label)}
                  </a>
                  {item.value && (
                    <span className="block text-white/70">
                      {safeText(item.value)}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-6 text-center text-xs text-white/70">
          <p>{safeText(footer.copyright)}</p>
          <p>{safeText(footer.subfooter)}</p>
        </div>
      </div>
    </footer>
  );
}
