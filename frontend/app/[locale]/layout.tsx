import type { Metadata } from "next";
import { Montserrat, Prompt } from "next/font/google";
import "../globals.css";
import { frontendBaseUrl } from "@/lib/urls";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import CookieConsent from "../components/CookieConsent";
import PerformanceTracker from "../components/PerformanceTracker";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Dynamic metadata based on locale
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  const baseUrl = frontendBaseUrl || 'https://airless-spray.rubyshop.co.th';
  const canonical = `${baseUrl}/${locale}`;
  const siteName = t('siteName');
  const description = t('description');

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: t('title'),
      template: `%s | ${siteName}`,
    },
    description,
    keywords: t('keywords').split(',').map((k: string) => k.trim()),
    alternates: {
      canonical,
      languages: {
        'th': `${baseUrl}/th`,
        'en': `${baseUrl}/en`,
        'x-default': `${baseUrl}/th`,
      },
    },
    openGraph: {
      title: siteName,
      description,
      url: canonical,
      siteName,
      type: "website",
      locale: locale === 'th' ? 'th_TH' : 'en_US',
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description,
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Get messages for the locale
  const messages = await getMessages();

  return (
    <div className={`${montserrat.variable} ${prompt.variable} antialiased`}>
      <NextIntlClientProvider messages={messages}>
        {children}
        <CookieConsent />
        {process.env.NODE_ENV === "development" && <PerformanceTracker />}
      </NextIntlClientProvider>
    </div>
  );
}
