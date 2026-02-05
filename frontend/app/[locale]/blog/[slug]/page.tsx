import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import DeferredChatWidget from "@/app/components/DeferredChatWidget";
import BlogContent from "@/app/components/BlogContent";
import { backendBaseUrl, frontendBaseUrl, resolveUploadUrl } from "@/lib/urls";

// Cache revalidation time in seconds (60 = 1 minute)
const REVALIDATE_TIME = 60;

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  content?: Record<string, any>;
  seo?: {
    title?: string;
    description?: string;
    image?: string;
  };
  publishedAt?: string;
};

type PostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  publishedAt?: string;
};

async function fetchPost(slug: string): Promise<Post | null> {
  const response = await fetch(`${backendBaseUrl}/posts/${slug}`, {
    next: { revalidate: REVALIDATE_TIME },
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.post as Post;
}

async function fetchOtherPosts(currentSlug: string): Promise<PostSummary[]> {
  try {
    const response = await fetch(
      `${backendBaseUrl}/posts?status=published`,
      { next: { revalidate: REVALIDATE_TIME } }
    );
    if (!response.ok) return [];
    const data = await response.json();
    const posts = (data.posts || []) as PostSummary[];
    return posts.filter((post) => post.slug !== currentSlug).slice(0, 5);
  } catch {
    return [];
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await fetchPost(slug);
  if (!post) return {};
  const title = post.seo?.title || post.title;
  const description = post.seo?.description || post.excerpt || "";
  const fallbackImage = frontendBaseUrl
    ? `${frontendBaseUrl}/og-aircon.jpg`
    : "/og-aircon.jpg";
  const image = resolveUploadUrl(
    post.seo?.image || post.coverImage || fallbackImage
  );
  const canonical = frontendBaseUrl
    ? `${frontendBaseUrl}/${locale}/blog/${post.slug}`
    : `/${locale}/blog/${post.slug}`;
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
      type: "article",
      publishedTime: post.publishedAt,
      authors: ["RUBYSHOP เทคโนโลยีเครื่องมือช่าง"],
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

export default async function BlogDetail({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = await fetchPost(slug);
  if (!post) return notFound();
  const [menu, footer, otherPosts] = await Promise.all([
    fetchMenu(locale),
    fetchFooter(),
    fetchOtherPosts(slug),
  ]);

  const homeUrl = frontendBaseUrl
    ? `${frontendBaseUrl}/${locale}`
    : `/${locale}`;
  const canonical = frontendBaseUrl
    ? `${frontendBaseUrl}/${locale}/blog/${post.slug}`
    : `/${locale}/blog/${post.slug}`;

  const coverImage = post.coverImage ? resolveUploadUrl(post.coverImage) : null;

  // Article Schema for rich snippets
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || post.seo?.description || "",
    image: coverImage || `${frontendBaseUrl}/og-aircon.jpg`,
    datePublished: post.publishedAt || new Date().toISOString(),
    dateModified: post.publishedAt || new Date().toISOString(),
    author: {
      "@type": "Organization",
      name: "RUBYSHOP เทคโนโลยีเครื่องมือช่าง",
      url: homeUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "RUBYSHOP เทคโนโลยีเครื่องมือช่าง",
      logo: {
        "@type": "ImageObject",
        url: `${frontendBaseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical,
    },
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "หน้าแรก",
        item: homeUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "บทความ",
        item: frontendBaseUrl
          ? `${frontendBaseUrl}/${locale}/blog`
          : `/${locale}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: canonical,
      },
    ],
  };

  return (
    <div>
      <Navbar items={menu?.items || []} cta={menu?.cta} logoUrl={menu?.logoUrl} />
      <article className="bg-slate-50 py-16">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-6">
            <div>
              <h1 className="text-3xl font-semibold text-[var(--brand-navy)]">
                {post.title}
              </h1>
              {post.publishedAt && (
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(post.publishedAt).toLocaleDateString("th-TH")}
                </p>
              )}
            </div>
          {post.coverImage && (
            <img
              src={resolveUploadUrl(post.coverImage)}
              alt={post.title}
              className="w-full rounded-3xl object-cover shadow-xl shadow-black/10"
            />
          )}
            {post.content && <BlogContent content={post.content} />}
          </div>
          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-black/10">
            <h2 className="text-lg font-semibold text-[var(--brand-navy)]">
              บทความอื่นๆ
            </h2>
            <div className="mt-4 grid gap-4">
              {otherPosts.map((item) => (
                <a
                  key={item.id}
                  href={`/blog/${item.slug}`}
                  className="group flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"
                >
                  <div className="h-16 w-20 overflow-hidden rounded-xl bg-slate-100">
                    {item.coverImage ? (
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-slate-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-[var(--brand-navy)]">
                      {item.title}
                    </p>
                    {item.publishedAt && (
                      <p className="mt-1 text-[10px] text-slate-400">
                        {new Date(item.publishedAt).toLocaleDateString("th-TH")}
                      </p>
                    )}
                  </div>
                </a>
              ))}
              {otherPosts.length === 0 && (
                <p className="text-xs text-slate-400">ยังไม่มีบทความอื่น</p>
              )}
            </div>
          </aside>
        </div>
      </article>
      {footer && <Footer footer={footer} />}
      <DeferredChatWidget />
    </div>
  );
}
