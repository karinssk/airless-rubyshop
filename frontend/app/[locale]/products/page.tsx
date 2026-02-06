import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import DeferredChatWidget from "../../components/DeferredChatWidget";
import { backendBaseUrl, frontendBaseUrl, resolveUploadUrl } from "@/lib/urls";
import { Link } from "@/lib/navigation";

// Cache revalidation time in seconds (60 = 1 minute)
const REVALIDATE_TIME = 60;

type ProductCategory = {
    id: string;
    name: string;
    slug: string;
    logo: string;
    parentId?: string;
    parent?: { id?: string; slug?: string } | string | null;
};

type ProductSummary = {
    id: string;
    name: string;
    slug: string;
    code: string;
    btu: string;
    price: { device: number; installation: number; total: number };
    category?: { id: string; name: string; slug: string } | null;
    images: string[];
};

async function fetchCategories(): Promise<ProductCategory[]> {
    try {
        const response = await fetch(`${backendBaseUrl}/product-categories`, {
            next: { revalidate: REVALIDATE_TIME },
        });
        if (!response.ok) return [];
        const data = await response.json();
        return data.categories || [];
    } catch {
        return [];
    }
}

async function fetchProducts(locale: string): Promise<ProductSummary[]> {
    try {
        const response = await fetch(
            `${backendBaseUrl}/products?status=published&locale=${locale}`,
            { next: { revalidate: REVALIDATE_TIME } }
        );
        if (!response.ok) return [];
        const data = await response.json();
        return data.products || [];
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
        ? `${frontendBaseUrl}/${locale}/products`
        : `/${locale}/products`;
    return {
        title: "เครื่องพ่นสีแรงดันสูง | RUBYSHOP",
        description: "จำหน่ายเครื่องพ่นสีแรงดันสูง คุณภาพดี ราคาประหยัด พร้อมบริการหลังการขาย",
        alternates: { canonical },
    };
}

export default async function ProductsPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ category?: string }>;
}) {
    const { locale } = await params;
    const searchParamsData = await searchParams;
    const requestedCategory = searchParamsData?.category;
    if (requestedCategory && requestedCategory !== "all") {
        redirect(`/${locale}/products/category/${requestedCategory}`);
    }
    const activeCategory = "all";
    const [categories, products, menu, footer] = await Promise.all([
        fetchCategories(),
        fetchProducts(locale),
        fetchMenu(locale),
        fetchFooter(),
    ]);

    const filteredProducts =
        activeCategory === "all"
            ? products
            : products.filter((p) => p.category?.slug === activeCategory);

    const categoryById = new Map(categories.map((category) => [category.id, category]));
    const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
    const categoryChildren = new Map<string, ProductCategory[]>();

    const getParentId = (category: ProductCategory) => {
        if (category.parentId) return category.parentId;
        if (typeof category.parent === "string") return category.parent;
        return category.parent?.id || "";
    };

    categories.forEach((category) => {
        const parentId = getParentId(category);
        if (!parentId) return;
        const children = categoryChildren.get(parentId) || [];
        children.push(category);
        categoryChildren.set(parentId, children);
    });

    const categoryTree = categories.filter((category) => !getParentId(category));
    const mobileCategoryItems: Array<{ item: ProductCategory; level: number }> = [];
    const buildMobileCategories = (items: ProductCategory[], level = 0) => {
        items.forEach((item) => {
            mobileCategoryItems.push({ item, level });
            const children = categoryChildren.get(item.id) || [];
            if (children.length > 0) {
                buildMobileCategories(children, level + 1);
            }
        });
    };
    buildMobileCategories(categoryTree.length > 0 ? categoryTree : categories);

    const getCategoryPath = (slug: string) => {
        const path: ProductCategory[] = [];
        let current = categoryBySlug.get(slug);
        const visited = new Set<string>();
        while (current && !visited.has(current.id)) {
            visited.add(current.id);
            path.unshift(current);
            const parentId = getParentId(current);
            current = parentId ? categoryById.get(parentId) : undefined;
        }
        return path;
    };

    const activeCategoryPath =
        activeCategory !== "all" ? getCategoryPath(activeCategory) : [];
    const pageTitle =
        activeCategoryPath.length > 0
            ? activeCategoryPath[activeCategoryPath.length - 1].name
            : "สินค้าทั้งหมด";

    const categoryCounts = categories.reduce<Record<string, number>>(
        (acc, category) => {
            acc[category.slug] = products.filter(
                (p) => p.category?.slug === category.slug
            ).length;
            return acc;
        },
        {}
    );

    return (
        <div>
            <Navbar items={menu?.items || []} cta={menu?.cta} logoUrl={menu?.logoUrl} />
            <section className="bg-slate-50 py-12">
                <div className="mx-auto max-w-6xl px-6">
                    <nav className="text-xs text-slate-400">
                        <Link href="/" className="hover:text-slate-600">
                            หน้าแรก
                        </Link>
                        <span className="px-1">›</span>
                        <Link href="/products" className="hover:text-slate-600">
                            สินค้าทั้งหมด
                        </Link>
                        {activeCategoryPath.map((category) => (
                            <span key={category.id} className="px-1">
                                ›
                                <Link
                                    href={`/products/category/${category.slug}`}
                                    className="ml-1 hover:text-slate-600"
                                >
                                    {category.name}
                                </Link>
                            </span>
                        ))}
                    </nav>
                    <h1 className="mt-4 text-3xl font-semibold text-[var(--brand-navy)]">
                        {pageTitle}
                    </h1>

                    {/* Category Filter (Mobile) */}
                    <div className="mt-6 lg:hidden">
                        <p className="text-xs font-semibold text-slate-500">ตัวกรองหมวดหมู่</p>
                    </div>
                    <div
                        id="category-filters"
                        className="sticky top-16 z-20 -mx-6 mt-2 flex flex-nowrap gap-3 overflow-x-auto bg-slate-50/95 px-6 py-3 backdrop-blur scrollbar-hide lg:hidden"
                    >
                        <Link
                            href="/products"
                            className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${activeCategory === "all"
                                    ? "border-[var(--brand-navy)] bg-[var(--brand-navy)] text-white shadow-md"
                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                }`}
                        >
                            <span>ทั้งหมด</span>
                            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeCategory === "all" ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>
                                {products.length}
                            </span>
                        </Link>
                        {mobileCategoryItems.map(({ item, level }) => (
                            <Link
                                key={item.id}
                                href={`/products/category/${item.slug}`}
                                className={`flex max-w-[220px] shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${activeCategory === item.slug
                                        ? "border-[var(--brand-navy)] bg-[var(--brand-navy)] text-white shadow-md"
                                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                    }`}
                            >
                                {item.logo && (
                                    <img
                                        src={resolveUploadUrl(item.logo)}
                                        alt=""
                                        className={`h-4 w-4 object-contain ${activeCategory === item.slug ? "brightness-0 invert" : ""}`}
                                    />
                                )}
                                <span className="min-w-0 flex-1 truncate">
                                    {level > 0 ? `↳ ${item.name}` : item.name}
                                </span>
                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeCategory === item.slug ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>
                                    {categoryCounts[item.slug] || 0}
                                </span>
                            </Link>
                        ))}
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
                        {/* Category Sidebar (Desktop) */}
                        <aside className="hidden lg:block">
                            <div className="sticky top-24 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                                <p className="text-sm font-semibold text-slate-700">หมวดหมู่</p>
                                <div className="mt-3 space-y-1 text-sm">
                                    <Link
                                        href="/products"
                                        className={`flex items-center justify-between rounded-lg px-3 py-2 transition ${activeCategory === "all"
                                                ? "bg-[var(--brand-navy)] text-white"
                                                : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                    >
                                        <span>สินค้าทั้งหมด</span>
                                        <span className={`text-xs ${activeCategory === "all" ? "text-white/80" : "text-slate-400"}`}>
                                            {products.length}
                                        </span>
                                    </Link>
                                    {(categoryTree.length > 0 ? categoryTree : categories).map((category) => {
                                        const renderCategory = (item: ProductCategory, level: number) => (
                                            <div key={item.id}>
                                                <Link
                                                    href={`/products/category/${item.slug}`}
                                                    className={`flex items-center justify-between rounded-lg px-3 py-2 transition ${activeCategory === item.slug
                                                            ? "bg-[var(--brand-navy)] text-white"
                                                            : "text-slate-700 hover:bg-slate-50"
                                                        }`}
                                                    style={{ paddingLeft: 12 + level * 12 }}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        {item.logo && (
                                                            <img
                                                                src={resolveUploadUrl(item.logo)}
                                                                alt=""
                                                                className={`h-4 w-4 object-contain ${activeCategory === item.slug ? "brightness-0 invert" : ""}`}
                                                            />
                                                        )}
                                                        {item.name}
                                                    </span>
                                                    <span className={`text-xs ${activeCategory === item.slug ? "text-white/80" : "text-slate-400"}`}>
                                                        {categoryCounts[item.slug] || 0}
                                                    </span>
                                                </Link>
                                                {(categoryChildren.get(item.id) || []).map((child) => renderCategory(child, level + 1))}
                                            </div>
                                        );

                                        return renderCategory(category, 0);
                                    })}
                                </div>
                            </div>
                        </aside>

                        {/* Products Grid */}
                        <div>
                            <div id="products-grid" className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3">
                                {filteredProducts.map((product) => (
                                    <Link
                                        key={product.id}
                                        href={`/products/${product.slug}`}
                                        className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md sm:p-4"
                                    >
                                        <div className="relative aspect-square overflow-hidden rounded-xl bg-white p-3">
                                            {product.images && product.images.length > 0 ? (
                                                <img
                                                    src={resolveUploadUrl(product.images[0])}
                                                    alt={product.name}
                                                    className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                                    No image
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-3 flex flex-1 flex-col">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                                {product.category?.name || "สินค้า"}
                                            </p>
                                            <h2 className="mt-1 text-sm font-semibold text-[var(--brand-navy)] line-clamp-2 leading-snug sm:text-base">
                                                {product.name}
                                            </h2>

                                            <div className="mt-3 flex items-end justify-between">
                                                <div>
                                                    <p className="text-[10px] text-slate-400">ราคาเริ่มต้น</p>
                                                    <p className="text-base font-bold text-[var(--brand-navy)] sm:text-lg">
                                                        {product.price?.total
                                                            ? `฿${product.price.total.toLocaleString()}`
                                                            : "สอบถามราคา"}
                                                    </p>
                                                </div>
                                                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        className="h-4 w-4"
                                                    >
                                                        <path d="M6 6h15l-1.5 9h-12z" />
                                                        <path d="M6 6l-2-2" />
                                                        <circle cx="9" cy="20" r="1" />
                                                        <circle cx="18" cy="20" r="1" />
                                                    </svg>
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {filteredProducts.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                        </svg>
                                    </div>
                                    <p className="text-lg font-semibold text-slate-600">
                                        ไม่พบสินค้าในหมวดหมู่นี้
                                    </p>
                                    <p className="mt-1 text-sm text-slate-400">ลองเลือกหมวดหมู่อื่นดูนะครับ</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </section>
            <div className="fixed bottom-4 left-1/2 z-30 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
                <a
                    href="#category-filters"
                    className="px-3 py-1 text-xs font-semibold text-slate-600"
                >
                    ตัวกรอง
                </a>
                <span className="h-5 w-px bg-slate-200" />
                <button
                    type="button"
                    className="px-3 py-1 text-xs font-semibold text-slate-600"
                    aria-label="Sort (coming soon)"
                >
                    เรียงลำดับ
                </button>
            </div>
            {footer && <Footer footer={footer} />}
            <DeferredChatWidget />
        </div>
    );
}
