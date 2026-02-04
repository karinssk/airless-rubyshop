import Script from "next/script";
import type { Metadata } from "next";
import ChatWidget from "../components/ChatWidget";
import PopupImage from "../components/PopupImage";
import Footer from "../components/Footer";
import Navbar, { type NavItem } from "../components/Navbar";
import ContactBar from "../components/ContactBar";
import PageRenderer from "../components/PageRenderer";
import { backendBaseUrl, frontendBaseUrl } from "@/lib/urls";

type Block = {
  type: string;
  props: Record<string, any>;
};

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
  layout: Block[];
};

const fallbackPage: PageData = {
  title: "Home",
  slug: "home",
  seo: {
    title: "RUBYSHOP",
    description: "บริการล้างแอร์ ซ่อมแอร์ ติดตั้งแอร์ แบบมืออาชีพ",
  },
  theme: { background: "" },
  layout: [],
};

// Cache revalidation time in seconds (60 = 1 minute)
const REVALIDATE_TIME = 60;

async function fetchPage() {
  try {
    const response = await fetch(`${backendBaseUrl}/pages/home`, {
      next: { revalidate: REVALIDATE_TIME },
    });
    if (!response.ok) return fallbackPage;
    const data = await response.json();
    return data.page as PageData;
  } catch {
    return fallbackPage;
  }
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

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchPage();
  const title = page.seo?.title || page.title;
  const description = page.seo?.description || "";
  const fallbackImage = frontendBaseUrl
    ? `${frontendBaseUrl}/og-aircon.jpg`
    : "/og-aircon.jpg";
  const image = page.seo?.image || fallbackImage;
  const canonical = frontendBaseUrl ? `${frontendBaseUrl}/` : "/";
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [{
        url: image,
        width: 1200,
        height: 630,
        alt: title,
      }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{
        url: image,
        alt: title,
      }],
    },
  };
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await fetchPage();
  const menu = await fetchMenu(locale);
  const footer = await fetchFooter();
  const faqBlock = page.layout.find((block) => block.type === "faq");
  const faqItems = (faqBlock?.props?.items || []) as Array<{
    question: string;
    answer: string;
  }>;
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
  const fallbackImage = frontendBaseUrl
    ? `${frontendBaseUrl}/og-aircon.jpg`
    : "/og-aircon.jpg";
  const businessImage = page.seo?.image || fallbackImage;
  const canonical = frontendBaseUrl ? `${frontendBaseUrl}/` : "/";
  const businessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${canonical}#localbusiness`,
    name: "RUBYSHOP เทคโนโลยีเครื่องมือช่าง",
    alternateName: "หจก.รูบี้ช๊อป",
    description: "ผู้นำเข้าจัดหาเครื่องมือสำหรับช่างมืออาชีพ เครื่องพ่นสีแรงดันสูง เครื่องพ่นสีกันไฟ เครื่องพ่นปูนฉาบ เครื่องตีเส้นถนน เครื่องกรีดผนัง เครื่องเลเซอร์ระดับ เครื่องผสมสี เครื่องปั่นหน้าปูน",
    image: businessImage,
    telephone: "+66-89-666-7802",
    address: {
      "@type": "PostalAddress",
      streetAddress: "9 โกสุมร่วมใจซอย 39",
      addressLocality: "ดอนเมือง",
      addressRegion: "กรุงเทพมหานคร",
      postalCode: "10210",
      addressCountry: "TH",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 13.9280,
      longitude: 100.5950,
    },
    hasMap: "https://maps.app.goo.gl/jAHhzBLmMAVrZxp2A",
    areaServed: {
      "@type": "Country",
      name: "Thailand",
    },
    priceRange: "฿฿฿",
    url: canonical,
    sameAs: [
      "https://www.facebook.com/profile.php?id=100063998652170",
      "https://lin.ee/qaNYHpP"
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "08:30",
        closes: "17:30",
      },
    ],
  };
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${canonical}#organization`,
    name: "RUBYSHOP เทคโนโลยีเครื่องมือช่าง",
    alternateName: "หจก.รูบี้ช๊อป",
    url: canonical,
    logo: {
      "@type": "ImageObject",
      url: businessImage,
      width: 250,
      height: 100,
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+66-89-666-7802",
      contactType: "sales",
      availableLanguage: ["Thai", "English"],
    },
    sameAs: [
      "https://www.facebook.com/profile.php?id=100063998652170",
      "https://lin.ee/qaNYHpP"
    ],
  };
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${canonical}#website`,
    name: "RUBYSHOP เทคโนโลยีเครื่องมือช่าง",
    url: canonical,
    publisher: {
      "@id": `${canonical}#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${canonical}products?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
 const backendBaseUrl = process.env.BACKEND_URL;
  return (

    <div>
      <ContactBar
        enabled={menu?.contactBar?.enabled}
        backgroundColor={menu?.contactBar?.backgroundColor}
        textColor={menu?.contactBar?.textColor}
        items={menu?.contactBar?.items || []}
      />
      <Navbar
        items={menu?.items || []}
        cta={menu?.cta}
        logoUrl={`${backendBaseUrl}/uploads/logo/rubyshop-no-bg-250pxx100px.jpg`}
      />
      {faqItems.length > 0 && (
        <Script
          id="faq-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <Script
        id="business-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
      />
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <PageRenderer page={page} />
      {footer && <Footer footer={footer} />}
      <ChatWidget />
      <PopupImage />
    </div>
  );
}
