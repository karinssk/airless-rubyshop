"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { resolveUploadUrl } from "@/lib/urls";
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from "next/navigation";
import { locales, type Locale } from "@/i18n";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  children?: NavItem[];
};

type NavCta = {
  label: string;
  href: string;
};

function NavSubMenuItem({ item, locale }: { item: NavItem; locale: string }) {
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className="relative group/submenu">
      <Link
        href={`/${locale}${item.href}`}
        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors border-l-2 border-transparent hover:border-black hover:bg-slate-100"
      >
        <span className="font-medium">{item.label}</span>
        {hasChildren && <span className="text-slate-400 text-sm">›</span>}
      </Link>
      {hasChildren && (
        <div className="absolute left-full top-0 ml-1 w-56 rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-2xl opacity-0 invisible -translate-x-2 transition-all duration-200 group-hover/submenu:opacity-100 group-hover/submenu:visible group-hover/submenu:translate-x-0 pointer-events-none group-hover/submenu:pointer-events-auto">
          <div className="grid gap-1">
            {item.children!.map((subChild) => (
              <Link
                key={subChild.id}
                href={`/${locale}${subChild.href}`}
                className="block rounded-lg px-3 py-2 text-sm transition-colors border-l-2 border-transparent hover:border-black hover:bg-slate-100"
              >
                <div className="font-medium text-slate-700">{subChild.label}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NavDropdownItem({ item, locale }: { item: NavItem; locale: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const hasChildren = item.children && item.children.length > 0;

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href={`/${locale}${item.href}`}
        className="flex min-w-0 items-center gap-2 rounded-full px-3 py-2 text-center whitespace-nowrap transition hover:bg-slate-100 max-w-[160px]"
      >
        <span className="block flex-1 truncate">{item.label}</span>
        {hasChildren && <span className="text-xs">▾</span>}
      </Link>
      {hasChildren && (
        <div
          className={`absolute left-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-2xl transition-all duration-200 ${
            isOpen
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-1 opacity-0"
          }`}
        >
          <div className="grid gap-1">
            {item.children!.map((child) => (
              <NavSubMenuItem key={child.id} item={child} locale={locale} />
            ))}
          </div>
          {/* Dropdown arrow pointer */}
          <div className="absolute -top-2 left-4 h-4 w-4 rotate-45 border-l border-t border-slate-200 bg-white"></div>
        </div>
      )}
    </div>
  );
}

export default function NavbarWithI18n({
  items,
  logoUrl,
}: {
  items: NavItem[];
  cta?: NavCta;
  logoUrl?: string;
}) {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const handleLanguageChange = (newLocale: Locale) => {
    const pathnameWithoutLocale = pathname.replace(`/${locale}`, '');
    router.push(`/${newLocale}${pathnameWithoutLocale}`);
    setLanguageOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white text-black">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-6 lg:py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            ☰
          </button>
          <Link href={`/${locale}`} className="flex items-center gap-3 text-lg font-semibold">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
              {logoUrl ? (
                <img
                  src={resolveUploadUrl(logoUrl)}
                  alt="Logo"
                  className="h-full w-full object-cover"
                />
              ) : null}
            </span>
            <span className="hidden sm:inline">RUBYSHOP</span>
          </Link>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <div className="relative">
            <button
              type="button"
              onClick={() => setLanguageOpen((prev) => !prev)}
              className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold uppercase"
              aria-label="Language"
            >
              {locale}
              <span className="text-[10px]">▾</span>
            </button>
            {languageOpen && (
              <div className="absolute right-0 top-full z-10 mt-2 w-24 rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-xl">
                {locales.map((lng) => (
                  <button
                    key={lng}
                    onClick={() => handleLanguageChange(lng)}
                    className={`w-full rounded-lg px-2 py-1 text-left uppercase ${
                      lng === locale ? "bg-slate-900 text-white" : "hover:bg-slate-100"
                    }`}
                  >
                    {lng}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="hidden flex-wrap items-center gap-4 text-sm lg:flex">
          {items.map((item) => (
            <NavDropdownItem key={item.id} item={item} locale={locale} />
          ))}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLanguageOpen((prev) => !prev)}
              className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold uppercase"
              aria-label="Language"
            >
              {locale}
              <span className="text-[10px]">▾</span>
            </button>
            {languageOpen && (
              <div className="absolute right-0 top-full z-10 mt-2 w-24 rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-xl">
                {locales.map((lng) => (
                  <button
                    key={lng}
                    onClick={() => handleLanguageChange(lng)}
                    className={`w-full rounded-lg px-2 py-1 text-left uppercase ${
                      lng === locale ? "bg-slate-900 text-white" : "hover:bg-slate-100"
                    }`}
                  >
                    {lng}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className="mx-auto grid max-w-6xl gap-4 px-4 py-4">
            {items.map((item) => (
              <div key={item.id} className="grid gap-2">
                <Link href={`/${locale}${item.href}`} className="text-sm font-semibold whitespace-normal leading-snug">
                  {item.label}
                </Link>
                {item.children && item.children.length > 0 && (
                  <div className="grid gap-2 border-l border-slate-200 pl-3 text-xs text-slate-600">
                    {item.children.map((child) => (
                      <div key={child.id} className="grid gap-1">
                        <Link href={`/${locale}${child.href}`} className="font-medium text-slate-700 whitespace-normal leading-snug">
                          {child.label}
                        </Link>
                        {child.children && child.children.length > 0 && (
                          <div className="grid gap-1 pl-3 text-[11px] text-slate-500">
                            {child.children.map((subChild) => (
                              <Link key={subChild.id} href={`/${locale}${subChild.href}`} className="whitespace-normal leading-snug">
                                {subChild.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Link
              href={`/${locale}/booking`}
              className="w-fit rounded-full bg-black px-4 py-2 text-xs font-semibold text-white"
            >
              Book
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
