import type { Metadata } from "next";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import DeferredChatWidget from "@/app/components/DeferredChatWidget";
import { backendBaseUrl, frontendBaseUrl, resolveUploadUrl } from "@/lib/urls";

// Cache revalidation time in seconds (300 = 5 minutes)
const REVALIDATE_TIME = 300;

type PostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  publishedAt?: string;
};

async function fetchPosts(query: string): Promise<PostSummary[]> {
  try {
    const searchParams = new URLSearchParams({ status: "published" });
    if (query) searchParams.set("q", query);
    const response = await fetch(
      `${backendBaseUrl}/posts?${searchParams.toString()}`,
      {
        next: { revalidate: REVALIDATE_TIME },
      }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.posts || [];
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
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = frontendBaseUrl
    ? `${frontendBaseUrl}/${locale}/blog`
    : `/${locale}/blog`;
  return {
    title: "Blog | RUBYSHOP",
    description: "ข่าวสารและบทความเกี่ยวกับบริการระบบปรับอากาศ",
    alternates: { canonical },
  };
}

export default async function BlogIndex({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const searchParamsData = await searchParams;
  const query = searchParamsData?.q?.trim() || "";
  const [posts, menu, footer] = await Promise.all([
    fetchPosts(query),
    fetchMenu(locale),
    fetchFooter(),
  ]);

  return (
    <div>
      <Navbar items={menu?.items || []} cta={menu?.cta} logoUrl={menu?.logoUrl} />
      <section className="bg-[var(--brand-yellow)] py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-6">
          <div className="text-center">
            <h1 className="text-4xl font-semibold text-[var(--brand-navy)]">
              บทความและข่าวสาร
            </h1>
            <p className="mt-2 text-sm text-[var(--brand-navy)]">
              รวมบทความที่น่าสนใจเกี่ยวกับระบบปรับอากาศและบริการของเรา
            </p>
          </div>
          <form className="mx-auto flex w-full max-w-xl flex-col gap-3 sm:flex-row">
            <input
              name="q"
              defaultValue={query}
              placeholder="ค้นหาบทความ..."
              className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-red-400 focus:outline-none"
            />
            <button className="rounded-full bg-[var(--brand-blue)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20">
              ค้นหา
            </button>
          </form>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <a
                key={post.id}
                href={`/blog/${post.slug}`}
                className="rounded-3xl bg-white p-5 shadow-xl shadow-black/10 transition hover:-translate-y-1"
              >
                <div className="h-40 overflow-hidden rounded-2xl bg-slate-100">
                  {post.coverImage ? (
                    <img
                      src={resolveUploadUrl(post.coverImage)}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <h2 className="text-lg font-semibold text-[var(--brand-navy)]">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-2 text-sm text-slate-600 line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  {post.publishedAt && (
                    <p className="mt-3 text-xs text-slate-400">
                      {new Date(post.publishedAt).toLocaleDateString("th-TH")}
                    </p>
                  )}
                </div>
              </a>
            ))}
            {posts.length === 0 && (
              <p className="text-center text-sm text-slate-500">
                {query ? "ไม่พบบทความที่ตรงกับคำค้นหา" : "ยังไม่มีบทความเผยแพร่"}
              </p>
            )}
          </div>
        </div>
      </section>
      {footer && <Footer footer={footer} />}
      <DeferredChatWidget />
    </div>
  );
}
