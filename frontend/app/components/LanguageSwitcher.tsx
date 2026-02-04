"use client";

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { locales, type Locale } from '@/i18n';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: Locale) => {
    // Remove the current locale prefix from pathname
    const pathnameWithoutLocale = pathname.replace(`/${locale}`, '');

    // Navigate to the same page with the new locale
    router.push(`/${newLocale}${pathnameWithoutLocale}`);
  };

  return (
    <div className="flex items-center gap-2">
      {locales.map((lng) => (
        <button
          key={lng}
          onClick={() => handleLanguageChange(lng)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            locale === lng
              ? 'bg-yellow-400 text-slate-900'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          aria-label={`Switch to ${lng === 'th' ? 'Thai' : 'English'}`}
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
