"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { backendBaseUrl, resolveUploadUrl } from "@/lib/urls";
import { Search, Plus, Filter, MoreHorizontal } from "lucide-react";

const API_URL = backendBaseUrl;

type ProductCategory = {
    id: string;
    name: string;
    slug: string;
};

type ProductSummary = {
    id: string;
    name: string | { th?: string; en?: string };
    slug: string;
    code: string | { th?: string; en?: string };
    btu: string;
    status: string;
    category?: { id: string; name: string; slug: string } | null;
    price: { device: number; installation: number; total: number };
    images: string[];
    updatedAt: string;
};

export default function ProductsList() {
    const [products, setProducts] = useState<ProductSummary[]>([]);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!API_URL) return;

            const [prodRes, catRes] = await Promise.all([
                fetch(`${API_URL}/products`),
                fetch(`${API_URL}/product-categories`)
            ]);

            const prodData = await prodRes.json();
            const catData = await catRes.json();

            setProducts(prodData.products || []);
            setCategories(catData.categories || []);
            setLoading(false);
        };
        loadData();
    }, []);

    const toText = (value: unknown) => {
        if (typeof value === "string") return value;
        if (value && typeof value === "object") {
            const maybe = value as { th?: string; en?: string };
            return maybe.th || maybe.en || "";
        }
        return String(value ?? "");
    };

    const searchLower = search.toLowerCase();
    const filteredProducts = products.filter(product => {
        const name = toText(product.name);
        const code = toText(product.code);
        const matchesSearch = name.toLowerCase().includes(searchLower) ||
            code.toLowerCase().includes(searchLower);
        const matchesCategory = filterCategory === "all" || product.category?.slug === filterCategory;
        return matchesSearch && matchesCategory;
    });

    return (
            <div className="mx-auto max-w-6xl">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
                        <p className="text-slate-500 text-sm">Manage your product catalog</p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/products/categories"
                            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Manage Categories
                        </Link>
                        <Link
                            href="/products/new"
                            className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4" />
                            Add Product
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            placeholder="Search products..."
                            className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-500"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                    >
                        <option value="all">All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                    </select>
                </div>

                {/* Table */}
                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Product</th>
                                    <th className="px-6 py-4 font-semibold">Model Code</th>
                                    <th className="px-6 py-4 font-semibold">Category</th>
                                    <th className="px-6 py-4 font-semibold">Price</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredProducts.map(product => (
                                    <tr key={product.id} className="group hover:bg-slate-50/50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                                                    {product.images?.[0] ? (
                                                        <img src={resolveUploadUrl(product.images[0])} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-xs text-slate-300">img</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900">{toText(product.name)}</div>
                                                    <div className="text-xs text-slate-500">{product.btu} BTU</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                            {toText(product.code)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {product.category ? (
                                                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                                                    {product.category.name}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-700">
                                            ฿{product.price?.total?.toLocaleString() ?? 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold ${product.status === 'published'
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${product.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'
                                                    }`} />
                                                {product.status === 'published' ? 'Active' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/products/${product.id}`}
                                                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:shadow-sm transition"
                                            >
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {filteredProducts.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            No products found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
    );
}
