import type { Metadata } from "next";
import Script from "next/script";
import { notFound, redirect } from "next/navigation";
import PageRenderer from "../../components/PageRenderer";
import ChatWidget from "../../components/ChatWidget";
import Navbar, { type NavItem } from "../../components/Navbar";
import Footer from "../../components/Footer";
import { backendBaseUrl, frontendBaseUrl } from "@/lib/urls";

// Cache revalidation time in seconds (60 = 1 minute)
const REVALIDATE_TIME = 60;

type PageData = {
  title: string;
  slug: string;
  seo?: {
    title?: string;
    description?: string;
    image?: string;
  };
  theme?: {
    background?: string;
  };
  layout: Array<{ type: string; props: Record<string, any> }>;
};

async function fetchPage(slug: string) {
  const response = await fetch(`${backendBaseUrl}/pages/${slug}`, {
    next: { revalidate: REVALIDATE_TIME },
  });
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
  const { slug } = await params;
  const page = await fetchPage(slug);
  if (!page) return {};
  const title = page.seo?.title || page.title;
  const description = page.seo?.description || "";
  const fallbackImage = frontendBaseUrl
    ? `${frontendBaseUrl}/og-aircon.jpg`
    : "/og-aircon.jpg";
  const image = page.seo?.image || fallbackImage;
  const canonical = frontendBaseUrl
    ? `${frontendBaseUrl}/${page.slug}`
    : `/${page.slug}`;
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
  if (slug === "home") {
    redirect("/");
  }
  const page = await fetchPage(slug);
  if (!page) return notFound();
  const menu = await fetchMenu(locale);
  const footer = await fetchFooter();
  const canonical = frontendBaseUrl
    ? `${frontendBaseUrl}/${page.slug}`
    : `/${page.slug}`;
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: frontendBaseUrl ? `${frontendBaseUrl}/` : "/",
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
