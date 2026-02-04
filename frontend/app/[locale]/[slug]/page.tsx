import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import PageRenderer from "../../components/PageRenderer";
import ChatWidget from "../../components/ChatWidget";
import Navbar, { type NavItem } from "../../components/Navbar";
import Footer from "../../components/Footer";
import { backendBaseUrl, frontendBaseUrl } from "@/lib/urls";

// Cache revalidation time in seconds (60 = 1 minute)
const REVALIDATE_TIME = 60;

type PageData = {
  title: string | Record<string, string>;
  slug: string;
  seo?: {
    title?: string | Record<string, string>;
    description?: string | Record<string, string>;
    image?: string;
  };
  theme?: {
    background?: string;
  };
  layout: Array<{ type: string; props: Record<string, any> }>;
};

const getLocaleValue = (
  value: string | Record<string, string> | undefined,
  locale: string
) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[locale] || value.th || value.en || "";
};

async function fetchPage(slug: string, locale: string) {
  const response = await fetch(
    `${backendBaseUrl}/pages/${slug}?locale=${encodeURIComponent(locale)}`,
    {
      next: { revalidate: REVALIDATE_TIME },
    }
  );
  if (!response.ok) return null;
  const data = await response.json();
  return data.page as PageData;
}

async function fetchMenu(locale: string) {
  try {
    const response = await fetch(`${backendBaseUrl}/menu?locale=${locale}`, {
      next: { revalidate: REVALIDATE_TIME },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.menu || null;
  } catch {
    return null;
  }
}

async function fetchFooter() {
  try {
    const response = await fetch(`${backendBaseUrl}/footer`, {
      next: { revalidate: REVALIDATE_TIME },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.footer || null;
  } catch {
    return null;
  }
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const page = await fetchPage(slug, locale);
  if (!page) return {};
  const title =
    getLocaleValue(page.seo?.title, locale) ||
    getLocaleValue(page.title, locale);
  const description = getLocaleValue(page.seo?.description, locale) || "";
  const fallbackImage = frontendBaseUrl
    ? `${frontendBaseUrl}/og-aircon.jpg`
    : "/og-aircon.jpg";
  const image = page.seo?.image || fallbackImage;
  const canonical = frontendBaseUrl
    ? `${frontendBaseUrl}/${locale}/${page.slug}`
    : `/${locale}/${page.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [image],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const page = await fetchPage(slug, locale);
  if (!page) return notFound();
  const menu = await fetchMenu(locale);
  const footer = await fetchFooter();
  const canonical = frontendBaseUrl
    ? `${frontendBaseUrl}/${locale}/${page.slug}`
    : `/${locale}/${page.slug}`;
  const homeUrl = frontendBaseUrl
    ? `${frontendBaseUrl}/${locale}`
    : `/${locale}`;
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: homeUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: page.title,
        item: canonical,
      },
    ],
  };

  return (
    <div>
      <Navbar items={menu?.items || []} cta={menu?.cta} logoUrl={menu?.logoUrl} />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <PageRenderer page={page} />
      {footer && <Footer footer={footer} />}
      <ChatWidget />
    </div>
  );
}
