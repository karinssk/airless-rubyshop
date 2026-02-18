import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import DeferredChatWidget from "../../../components/DeferredChatWidget";
import BlogContent from "../../../components/BlogContent";
import ServiceGallery from "../../../components/ServiceGallery";
import ExpandableContent from "../../../components/ExpandableContent";
import { backendBaseUrl, frontendBaseUrl, resolveUploadUrl } from "@/lib/urls";
import { Link } from "@/lib/navigation";

// Cache revalidation time in seconds (300 = 5 minutes)
const REVALIDATE_TIME = 300;

type ProductDetail = {
    id: string;
    name: string;
    slug: string;
    code: string;
    btu: string;
    status: string;
    categoryId: string | null;
    category?: { id: string; name: string; slug: string } | null;
    description: Record<string, any>;
    features: Record<string, string>;
    highlights: string[];
    warranty: { device: string; compressor: string };
    inBox: string[];
    price: { device: number; installation: number; total: number };
    images: string[];
    videoUrl?: string;
    compareTable?: {
        heading?: string;
        subheading?: string;
        columns?: string[];
        rows?: Array<Array<{ value?: string; href?: string }>>;
    };
    seo?: { title?: string; description?: string; image?: string };
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

async function fetchProduct(slug: string, locale: string): Promise<ProductDetail | null> {
    const response = await fetch(`${backendBaseUrl}/products/${slug}?locale=${locale}`, {
        next: { revalidate: REVALIDATE_TIME },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.product as ProductDetail;
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
    params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
    const { locale, slug } = await params;
    const product = await fetchProduct(slug, locale);
    if (!product) return {};
    const title = product.seo?.title || product.name;
    const storeName = "RUBYSHOP เทคโนโลยีเครื่องมือช่าง";
    const storeDescription =
        "หจก.รูบี้ช๊อปเราคือผู้นำเข้าจัดหาเครื่องมือสำหรับช่างมืออาชีพเช่น - เครื่องพ่นสีแรงดันสูง - เครื่องพ่นสีกันไฟ - เครื่องพ่นปูนฉาบ - เครื่องตีเส้นถนน - เครื่องกรีดผนัง - เครื่องเลเซอร์ระดับ - เครื่องผสมสี - เครื่องปั่นหน้าปูนและอื่นๆอีกมากมายจากต่างประเทศและสั่งผลิตสินค้าและจัดจำหน่ายทั้งปลึกและส่งลูกค้าจึงเชื่อมันกับเราได้ว่าเราสามารถจัดหาอะไหล่หรือให้คำแนะนำได้สำหรับเครื่องจักรทุกชนิดมีเครื่องให้ท่านทดลองใช้งานกับวัสดุสีของท่านก่อนซื้อ";
    const description =
        product.seo?.description ||
        `${product.name} | ${storeName} — ${storeDescription}`;
    const fallbackImage = resolveUploadUrl(
        "/uploads/logo/airless-rubyshop-fallback.webp"
    );
    const image = resolveUploadUrl(
        product.seo?.image || product.images?.[0] || fallbackImage
    );
    const canonical = frontendBaseUrl
        ? `${frontendBaseUrl}/${locale}/products/${product.slug}`
        : `/${locale}/products/${product.slug}`;
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

export default async function ProductDetail({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>;
}) {
    const { locale, slug } = await params;
    const product = await fetchProduct(slug, locale);
    if (!product) return notFound();

    const youtubeIdMatch =
        product.videoUrl?.match(/(?:v=|youtu\.be\/|\/embed\/)([A-Za-z0-9_-]{6,})/) ||
        product.videoUrl?.match(/^[A-Za-z0-9_-]{6,}$/);
    const youtubeId = youtubeIdMatch ? youtubeIdMatch[1] || youtubeIdMatch[0] : "";

    const [menu, footer, products] = await Promise.all([
        fetchMenu(locale),
        fetchFooter(),
        fetchProducts(locale),
    ]);

    const canonical = frontendBaseUrl
        ? `${frontendBaseUrl}/${locale}/products/${product.slug}`
        : `/${locale}/products/${product.slug}`;
    const homeUrl = frontendBaseUrl
        ? `${frontendBaseUrl}/${locale}`
        : `/${locale}`;

    const categoryName = product.category?.name || "สินค้าเครื่องมือช่าง";
    const categoryPath = product.category?.slug
        ? `/products/category/${product.category.slug}`
        : "/products";
    const categoryUrl = frontendBaseUrl
        ? `${frontendBaseUrl}/${locale}${categoryPath}`
        : `/${locale}${categoryPath}`;

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
                name: categoryName,
                item: categoryUrl,
            },
            {
                "@type": "ListItem",
                position: 3,
                name: product.name,
                item: canonical,
            },
        ],
    };

    const images = product.images.map(img => resolveUploadUrl(img));
    const otherProducts = products
        .filter((item) => item.slug !== product.slug)
        .filter((item) => {
            if (!product.category?.slug) return true;
            return item.category?.slug === product.category.slug;
        })
        .slice(0, 4);

    const resolveFeatures = () => {
        const raw = product.features as unknown;
        if (!raw || typeof raw !== "object") return {};
        const record = raw as Record<string, any>;
        if ("th" in record || "en" in record) {
            const localized = record[locale] ?? record.th ?? record.en;
            if (localized && typeof localized === "object" && !Array.isArray(localized)) {
                return localized as Record<string, any>;
            }
            if (typeof localized === "string") {
                const label = locale === "th" ? "รายละเอียด" : "Details";
                return { [label]: localized };
            }
            return {};
        }
        if (Array.isArray(raw)) {
            const label = locale === "th" ? "รายการ" : "Item";
            return raw.reduce<Record<string, any>>((acc, value, index) => {
                acc[`${label} ${index + 1}`] = value;
                return acc;
            }, {});
        }
        return record;
    };

    const featureEntries = Object.entries(resolveFeatures())
        .map(([key, value]) => {
            let displayValue = value;
            if (value && typeof value === "object") {
                if ("th" in value || "en" in value) {
                    displayValue = value[locale] ?? value.th ?? value.en ?? "";
                } else {
                    displayValue = "";
                }
            }
            return [key, displayValue];
        })
        .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "");

    // Product Schema for rich snippets
    const productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.seo?.description || `${product.name} - ${categoryName}`,
        image: images,
        sku: product.code,
        mpn: product.code,
        brand: {
            "@type": "Brand",
            name: "RUBYSHOP",
        },
        category: categoryName,
        offers: {
            "@type": "Offer",
            url: canonical,
            priceCurrency: "THB",
            price: product.price.total,
            priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            availability: "https://schema.org/InStock",
            seller: {
                "@type": "Organization",
                name: "RUBYSHOP เทคโนโลยีเครื่องมือช่าง",
            },
        },
    };

    return (
        <div>
            <Navbar items={menu?.items || []} cta={menu?.cta} logoUrl={menu?.logoUrl} />
            <article className="bg-[#f8f9fa] py-10 min-h-screen">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
                />
                <div className="mx-auto max-w-7xl px-4 lg:px-6">
                    <nav className="mb-6 text-xs text-slate-400">
                        <Link href="/" className="hover:text-slate-600">
                            หน้าแรก
                        </Link>
                        <span className="px-1">›</span>
                        <Link href={categoryPath} className="hover:text-slate-600">
                            {categoryName}
                        </Link>
                        <span className="px-1">›</span>
                        <span>{product.name}</span>
                    </nav>

                    <div className="grid gap-8 items-start lg:grid-cols-[1fr_400px]">

                        {/* Gallery */}
                        <div className="order-1 lg:order-none lg:col-start-1">
                            <div className="bg-white rounded-3xl p-4 shadow-sm sm:p-6">
                                <ServiceGallery images={images} youtubeId={youtubeId} />
                            </div>
                        </div>

                        {/* Right Column: Key Info & CTA (Sticky) */}
                        <div className="order-2 space-y-6 lg:order-none lg:col-start-2 lg:row-start-1 lg:sticky lg:top-24">
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                {product.category && (
                                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                                        {product.category.name}
                                    </div>
                                )}
                                <h1 className="text-2xl font-bold text-black leading-tight">
                                    {product.name}
                                </h1>
                                <div className="mt-2 flex items-center gap-3 text-sm font-medium">
                                    <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded">{product.code}</span>
                                    {product.btu && <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{product.btu} BTU</span>}
                                </div>

                                <div className="my-6 pt-6 border-t border-slate-100">
                                    <div className="flex justify-between items-baseline mb-3">
                                        <span className="text-sm text-slate-500">รหัสสินค้า</span>
                                        <span className="text-base font-semibold text-slate-700">SKU-{product.code}</span>
                                    </div>
                                    <div className="flex justify-between items-end pt-3 border-t border-slate-100">
                                        <span className="text-sm font-medium text-slate-900">ราคาสุทธิ</span>
                                        <span className="text-3xl font-bold text-[var(--brand-navy)]">฿{product.price.total.toLocaleString()}</span>
                                    </div>
                                    <p className="text-[10px] text-right text-slate-400 mt-1">* ราคายังไม่รวมรวมภาษีมูลค่าเพิ่ม</p>
                                </div>

                                <div className="space-y-3">
                                    <a
                                        href="https://lin.ee/qaNYHpP"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full rounded-xl bg-[#06c755] py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-green-500/20 transition hover:bg-[#05b64d] hover:shadow-green-500/30"
                                    >
                                        สั่งซื้อ / สอบถามทาง LINE
                                    </a>
                                    <a
                                        href="tel:0896667802"
                                        className="block w-full rounded-xl bg-white border border-slate-200 py-3.5 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        โทรสอบถาม 0896667802
                                    </a>
                                </div>
                            </div>

                            {/* Highlights */}
                            {product.highlights.length > 0 && (
                                <div className="bg-red-50 rounded-3xl p-6 border border-red-100">
                                    <h3 className="text-sm font-bold text-red-900 uppercase tracking-wide mb-3">จุดเด่นสินค้า</h3>
                                    <ul className="space-y-2">
                                        {product.highlights.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-500 shrink-0">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                                </svg>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Service Warranty */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.243-8.25-3.285z" />
                                    </svg>
                                    การรับประกันคุณภาพและบริการ (Service Warranty)
                                </h3>
                                <div className="space-y-3 text-sm text-slate-700">
                                    <p>
                                        <span className="font-semibold">Service:</span> ฟรีค่าบริการตรวจเช็คและซ่อมบำรุง นาน 1 ปี
                                    </p>
                                    <p>
                                        <span className="font-semibold">Spare Parts:</span> พร้อมสนับสนุนอะไหล่แท้ครบวงจร (คิดค่าใช้จ่ายตามจริง)
                                    </p>
                                    <p className="font-semibold text-slate-900">
                                        มั่นใจได้ในงานซ่อมด้วยทีมช่างผู้เชี่ยวชาญ
                                    </p>
                                </div>
                            </div>

                        </div>

                        {/* Left Column: Details */}
                        <div className="order-3 space-y-8 lg:order-none lg:col-start-1">
                            {/* Compare Table */}
                            {product.compareTable?.columns?.length ? (
                                <div className="bg-white rounded-3xl p-6 shadow-sm overflow-hidden">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-bold text-black">
                                            {product.compareTable.heading || "Compare Models"}
                                        </h3>
                                        {product.compareTable.subheading && (
                                            <p className="text-sm text-slate-500 mt-1">
                                                {product.compareTable.subheading}
                                            </p>
                                        )}
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm border border-slate-200 border-collapse">
                                            <thead className="bg-[var(--brand-navy)] text-white">
                                                <tr>
                                                    {product.compareTable.columns.map((column, colIndex) => (
                                                        <th
                                                            key={`${column}-${colIndex}`}
                                                            className="px-4 py-3 text-left font-semibold border border-[var(--brand-navy)]"
                                                        >
                                                            {column}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {product.compareTable?.rows?.map((row, rowIndex) => (
                                                    <tr
                                                        key={`row-${rowIndex}`}
                                                        className="odd:bg-white even:bg-slate-50/70"
                                                    >
                                                        {product.compareTable?.columns?.map((_, colIndex) => {
                                                            const cell = row?.[colIndex];
                                                            const value = cell?.value || "";
                                                            const href = cell?.href || "";
                                                            return (
                                                                <td
                                                                    key={`cell-${rowIndex}-${colIndex}`}
                                                                    className="px-4 py-3 border border-slate-200 text-slate-700"
                                                                >
                                                                    {href ? (
                                                                        <a
                                                                            href={href}
                                                                            className="font-semibold text-slate-800 underline underline-offset-2"
                                                                        >
                                                                            {value || "รายละเอียด"}
                                                                        </a>
                                                                    ) : (
                                                                        <span>{value}</span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : null}

                            {/* Features Table */}
                            {featureEntries.length > 0 && (
                                <div className="bg-white rounded-3xl p-6 shadow-sm overflow-hidden">
                                    <h3 className="text-lg font-bold text-black mb-4">ข้อมูลทางเทคนิค</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <tbody className="divide-y divide-slate-100">
                                                {featureEntries.map(([key, value]) => (
                                                    <tr key={key} className="group hover:bg-slate-50">
                                                        <td className="py-3 px-4 font-medium text-slate-600 w-1/3 bg-slate-50/50 group-hover:bg-slate-50">{key}</td>
                                                        <td className="py-3 px-4 text-slate-800">{String(value)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            {product.description && (
                                <div className="bg-white rounded-3xl p-6 shadow-sm">
                                    <h3 className="text-lg font-bold text-black mb-4">รายละเอียดสินค้า</h3>
                                    <div className="prose prose-slate max-w-none text-sm text-slate-600">
                                        <BlogContent content={product.description} />
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                    {otherProducts.length > 0 && (
                        <div className="mt-12">
                            <div className="flex items-center justify-between gap-4">
                                <h2 className="text-xl font-semibold text-[var(--brand-navy)]">
                                    สินค้าอื่นๆ
                                </h2>
                                <Link
                                    href={categoryPath}
                                    className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                                >
                                    ดูเพิ่มเติม
                                </Link>
                            </div>
                            <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                                {otherProducts.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/products/${item.slug}`}
                                        className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md sm:p-4"
                                    >
                                        <div className="relative aspect-square overflow-hidden rounded-xl bg-white p-3">
                                            {item.images && item.images.length > 0 ? (
                                                <img
                                                    src={resolveUploadUrl(item.images[0])}
                                                    alt={item.name}
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
                                                {item.category?.name || "สินค้า"}
                                            </p>
                                            <h3 className="mt-1 text-sm font-semibold text-[var(--brand-navy)] line-clamp-2 leading-snug sm:text-base">
                                                {item.name}
                                            </h3>

                                            <div className="mt-3 flex items-end justify-between">
                                                <div>
                                                    <p className="text-[10px] text-slate-400">ราคาเริ่มต้น</p>
                                                    <p className="text-base font-bold text-[var(--brand-navy)] sm:text-lg">
                                                        {item.price?.total
                                                            ? `฿${item.price.total.toLocaleString()}`
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
                        </div>
                    )}
                </div>
            </article>
            {footer && <Footer footer={footer} />}
            <DeferredChatWidget />
        </div>
    );
}
