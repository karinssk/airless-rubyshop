import type { Metadata } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ChatWidget from "../../components/ChatWidget";
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
        title: "สินค้าแอร์ | RUBYSHOP",
        description: "จำหน่ายแอร์บ้าน แอร์สำนักงาน ครบทุกยี่ห้อชั้นนำ พร้อมบริการติดตั้งมาตรฐานสูง",
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
    const activeCategory = searchParamsData?.category || "all";
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
                                    href={`/products?category=${category.slug}`}
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

                    {/* Category Filter */}
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href="/products"
                            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${activeCategory === "all"
                                    ? "border-[var(--brand-navy)] bg-[var(--brand-navy)] text-white shadow-md"
                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                }`}
                        >
                            <span>ทั้งหมด</span>
                            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeCategory === "all" ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>
                                {products.length}
                            </span>
                        </Link>
                        {(categoryTree.length > 0 ? categoryTree : categories).map((category) => {
                            const renderCategory = (item: ProductCategory, level: number) => (
                                <div key={item.id} className="flex flex-wrap gap-3">
                                    <Link
                                        href={`/products?category=${item.slug}`}
                                        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${activeCategory === item.slug
                                                ? "border-[var(--brand-navy)] bg-[var(--brand-navy)] text-white shadow-md"
                                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                            }`}
                                        style={{ marginLeft: level * 12 }}
                                    >
                                        {item.logo && (
                                            <img
                                                src={resolveUploadUrl(item.logo)}
                                                alt=""
                                                className={`w-4 h-4 object-contain ${activeCategory === item.slug ? "brightness-0 invert" : ""}`}
                                            />
                                        )}
                                        <span>{level > 0 ? `↳ ${item.name}` : item.name}</span>
                                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeCategory === item.slug ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>
                                            {categoryCounts[item.slug] || 0}
                                        </span>
                                    </Link>
                                    {(categoryChildren.get(item.id) || []).map((child) => renderCategory(child, level + 1))}
                                </div>
                            );

                            return renderCategory(category, 0);
                        })}
                    </div>

                    {/* Products Grid */}
                    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredProducts.map((product) => (
                            <Link
                                key={product.id}
                                href={`/products/${product.slug}`}
                                className="group relative flex flex-col rounded-3xl bg-white p-4 shadow-xl shadow-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-black/10"
                            >
                                {/* Image */}
                                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-50">
                                    {product.images && product.images.length > 0 ? (
                                        <img
                                            src={resolveUploadUrl(product.images[0])}
                                            alt={product.name}
                                            className="h-full w-full object-contain mix-blend-multiply transition duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                            No image
                                        </div>
                                    )}
                                    {product.category && (
                                        <span className="absolute top-2 left-2 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 backdrop-blur-sm">
                                            {product.category.name}
                                        </span>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="mt-4 flex flex-1 flex-col">
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start gap-2">
                                            <h2 className="text-base font-semibold text-[var(--brand-navy)] line-clamp-2 leading-snug">
                                                {product.name}
                                            </h2>
                                        </div>
                                        <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-500">
                                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{product.code}</span>
                                            {product.btu && <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-600">{product.btu} BTU</span>}
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-end justify-between">
                                        <div>
                                            <p className="text-[10px] text-slate-400">ราคาเริ่มต้น</p>
                                            <p className="text-lg font-bold text-[#f25c2a]">
                                                {product.price?.total
                                                    ? `฿${product.price.total.toLocaleString()}`
                                                    : "สอบถามราคา"}
                                            </p>
                                        </div>
                                        <span className="h-8 w-8 rounded-full bg-[var(--brand-yellow)] flex items-center justify-center text-[var(--brand-navy)] transition group-hover:bg-[var(--brand-navy)] group-hover:text-white">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {filteredProducts.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="h-20 w-20 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </div>
                            <p className="text-lg font-semibold text-slate-600">
                                ไม่พบสินค้าในหมวดหมู่นี้
                            </p>
                            <p className="text-sm text-slate-400 mt-1">ลองเลือกหมวดหมู่อื่นดูนะครับ</p>
                        </div>
                    )}
                </div>
            </section>
            {footer && <Footer footer={footer} />}
            <ChatWidget />
        </div>
    );
}
