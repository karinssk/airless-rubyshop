// EXAMPLE PAGE WITH SEO IMPLEMENTATION
// Copy this pattern for your pages in app/[locale]/your-page/page.tsx

import { useTranslations } from 'next-intl';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

// ============================================
// 1. GENERATE METADATA FOR SEO (Server Side)
// ============================================
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pages.services' });

  return {
    // Page title (appears in browser tab and search results)
    title: t('title'), // "Our Services - RUBYSHOP"

    // Meta description (appears in search results - aim for 150-160 chars)
    description: t('description'),

    // Keywords (comma-separated)
    keywords: t('keywords').split(',').map((k: string) => k.trim()),

    // Canonical URL and language alternates
    alternates: {
      canonical: `/${locale}/services`,
      languages: {
        'th': '/th/services',
        'en': '/en/services',
        'x-default': '/th/services', // Default fallback
      },
    },

    // Open Graph (for Facebook, LinkedIn, etc.)
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `/${locale}/services`,
      type: 'website',
      locale: locale === 'th' ? 'th_TH' : 'en_US',
      alternateLocale: locale === 'th' ? 'en_US' : 'th_TH',
      images: [
        {
          url: '/og-services.jpg', // Create this image (1200x630px)
          width: 1200,
          height: 630,
          alt: t('ogImageAlt'),
        },
      ],
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: ['/og-services.jpg'],
    },
  };
}

// ============================================
// 2. PAGE COMPONENT
// ============================================
export default function ServicesPage() {
  const t = useTranslations('pages.services');

  // Optional: Add structured data (Schema.org)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Air Conditioning Services",
    "provider": {
      "@type": "LocalBusiness",
      "name": "RUBYSHOP",
      "image": "/logo.png",
      "telephone": "+66-XXX-XXX-XXXX",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "TH"
      }
    }
  };

  return (
    <>
      {/* Add structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Main content */}
      <div className="container mx-auto px-4 py-12">
        {/* H1 should contain main keyword */}
        <h1 className="text-4xl font-bold mb-6">
          {t('heading')}
        </h1>

        {/* Content with proper heading hierarchy */}
        <div className="prose max-w-none">
          <h2>{t('installationHeading')}</h2>
          <p>{t('installationContent')}</p>

          <h2>{t('repairHeading')}</h2>
          <p>{t('repairContent')}</p>

          <h2>{t('maintenanceHeading')}</h2>
          <p>{t('maintenanceContent')}</p>
        </div>
      </div>
    </>
  );
}

// ============================================
// 3. ADD THESE TRANSLATIONS TO messages/en.json
// ============================================
/*
{
  "pages": {
    "services": {
      "title": "Professional Air Conditioning Services - RUBYSHOP",
      "description": "Expert AC installation, repair, and maintenance services in Thailand. Quick response, certified technicians, guaranteed workmanship.",
      "keywords": "air conditioning service, AC repair, AC installation, AC maintenance, aircon cleaning, Thailand",
      "ogImageAlt": "RUBYSHOP Services",
      "heading": "Our Professional Services",
      "installationHeading": "Installation Services",
      "installationContent": "Professional installation of all air conditioning brands...",
      "repairHeading": "Repair Services",
      "repairContent": "Expert repair and troubleshooting for all AC issues...",
      "maintenanceHeading": "Maintenance Services",
      "maintenanceContent": "Regular maintenance to keep your AC running efficiently..."
    }
  }
}
*/

// ============================================
// 4. ADD THESE TRANSLATIONS TO messages/th.json
// ============================================
/*
{
  "pages": {
    "services": {
      "title": "บริการแอร์มืออาชีพ - RUBYSHOP",
      "description": "บริการติดตั้ง ซ่อม และบำรุงรักษาแอร์โดยผู้เชี่ยวชาญ ตอบสนองรวดเร็ว ช่างมีใบรับรอง รับประกันคุณภาพงาน",
      "keywords": "บริการแอร์, ซ่อมแอร์, ติดตั้งแอร์, บำรุงรักษาแอร์, ล้างแอร์, ประเทศไทย",
      "ogImageAlt": "บริการของ RUBYSHOP",
      "heading": "บริการมืออาชีพของเรา",
      "installationHeading": "บริการติดตั้ง",
      "installationContent": "ติดตั้งเครื่องปรับอากาศทุกยี่ห้ออย่างมืออาชีพ...",
      "repairHeading": "บริการซ่อมแซม",
      "repairContent": "ซ่อมและแก้ไขปัญหาแอร์ทุกประเภทโดยผู้เชี่ยวชาญ...",
      "maintenanceHeading": "บริการบำรุงรักษา",
      "maintenanceContent": "บำรุงรักษาอย่างสม่ำเสมอเพื่อให้แอร์ทำงานอย่างมีประสิทธิภาพ..."
    }
  }
}
*/

// ============================================
// 5. SEO BEST PRACTICES USED IN THIS EXAMPLE
// ============================================
/*
✅ Unique title with keywords and brand name
✅ Compelling meta description (under 160 characters)
✅ Relevant keywords
✅ Canonical URL with language alternates
✅ Hreflang tags (automatic from layout)
✅ Open Graph tags for social media
✅ Twitter Card metadata
✅ Structured data (Schema.org)
✅ Proper heading hierarchy (H1 > H2 > H3)
✅ Semantic HTML
✅ Alt text for images
✅ Mobile-responsive design
*/

// ============================================
// 6. TESTING YOUR SEO
// ============================================
/*
1. View page source (Ctrl+U) and verify:
   - <title> tag is correct
   - <meta name="description"> is present
   - hreflang links are present
   - Open Graph tags are present

2. Test with tools:
   - Google Rich Results Test
   - Facebook Sharing Debugger
   - Twitter Card Validator

3. Check in browser DevTools:
   - Lighthouse SEO audit
   - Accessibility score
*/
