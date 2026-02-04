"use client";

import { useEffect, useState } from "react";
import { backendBaseUrl, resolveUploadUrl } from "@/lib/urls";

const API_URL = backendBaseUrl;

const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

type ProductCategory = {
    id: string;
    name: string;
    slug: string;
    logo: string;
    order: number;
    parentId?: string | null;
    parent?: { id?: string; slug?: string } | null;
};

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const Toast = MySwal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    },
});

export default function CategoriesManager() {
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [categoryForm, setCategoryForm] = useState({
        id: "",
        name: "",
        slug: "",
        logo: "",
        parentId: "",
        order: 0,
    });

    const loadCategories = async () => {
        if (!API_URL) return;
        const response = await fetch(`${API_URL}/product-categories`);
        const data = await response.json();
        setCategories(data.categories || []);
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const uploadImage = async (file: File) => {
        if (!API_URL) {
            Toast.fire({ icon: "error", title: "Config Error: Backend URL missing" });
            console.error("API_URL is missing");
            return "";
        }
        try {
            const formData = new FormData();
            formData.append("file", file);
            const response = await fetch(`${API_URL}/uploads`, {
                method: "POST",
                body: formData,
            });
            if (!response.ok) {
                const err = await response.json();
                Toast.fire({ icon: "error", title: `Upload failed: ${err.error}` });
                return "";
            }
            const data = await response.json();
            return data.url as string;
        } catch (e) {
            console.error("Upload error:", e);
            Toast.fire({ icon: "error", title: "Upload failed" });
            return "";
        }
    };

    const saveCategory = async () => {
        if (!API_URL || !categoryForm.name || !categoryForm.slug) {
            Toast.fire({ icon: "warning", title: "Name and Slug are required" });
            return;
        }
        const payload = {
            name: categoryForm.name,
            slug: categoryForm.slug,
            logo: categoryForm.logo,
            parentId: categoryForm.parentId || null,
            order: categoryForm.order || 0,
        };

        try {
            if (categoryForm.id) {
                await fetch(`${API_URL}/product-categories/${categoryForm.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                Toast.fire({ icon: "success", title: "Updated successfully" });
            } else {
                await fetch(`${API_URL}/product-categories`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                Toast.fire({ icon: "success", title: "Created successfully" });
            }
            setCategoryForm({ id: "", name: "", slug: "", logo: "", parentId: "", order: 0 });
            loadCategories();
        } catch (e) {
            Toast.fire({ icon: "error", title: "Failed to save" });
        }
    };

    const deleteCategory = async (id: string) => {
        if (!API_URL || !id) return;

        const result = await MySwal.fire({
            title: "Are you sure?",
            text: "Products in this category will become uncategorized.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!"
        });

        if (result.isConfirmed) {
            await fetch(`${API_URL}/product-categories/${id}`, {
                method: "DELETE",
            });
            if (categoryForm.id === id) {
                setCategoryForm({ id: "", name: "", slug: "", logo: "", parentId: "", order: 0 });
            }
            loadCategories();
            Swal.fire("Deleted!", "Category has been deleted.", "success");
        }
    };

    const getParentId = (category: ProductCategory) => {
        const rawParent = category.parentId || category.parent?.id || "";
        if (!rawParent) return "";
        if (typeof rawParent === "string") return rawParent;
        if (typeof rawParent === "object") {
            const maybe = rawParent as { id?: string; _id?: string };
            return maybe.id || maybe._id || "";
        }
        return String(rawParent);
    };

    const categoryById = new Map(categories.map((category) => [category.id, category]));
    const childrenMap = new Map<string, ProductCategory[]>();
    categories.forEach((category) => {
        const parentId = getParentId(category);
        if (!parentId) return;
        const list = childrenMap.get(parentId) || [];
        list.push(category);
        childrenMap.set(parentId, list);
    });

    const roots = categories.filter((category) => !getParentId(category));

    const getDescendantIds = (id: string) => {
        const result = new Set<string>();
        const stack = [id];
        while (stack.length > 0) {
            const currentId = stack.pop();
            if (!currentId) continue;
            const children = childrenMap.get(currentId) || [];
            for (const child of children) {
                if (!result.has(child.id)) {
                    result.add(child.id);
                    stack.push(child.id);
                }
            }
        }
        return result;
    };

    const blockedParentIds = categoryForm.id
        ? new Set([categoryForm.id, ...getDescendantIds(categoryForm.id)])
        : new Set<string>();

    const renderParentOptions = (items: ProductCategory[], level: number): JSX.Element[] =>
        items.flatMap((item) => {
            if (blockedParentIds.has(item.id)) {
                return [];
            }
            const label = `${"—".repeat(level)} ${item.name}`.trim();
            const children = childrenMap.get(item.id) || [];
            return [
                <option key={item.id} value={item.id}>
                    {label}
                </option>,
                ...renderParentOptions(children, level + 1),
            ];
        });

    const renderCategoryTree = (items: ProductCategory[], level: number): JSX.Element[] =>
        items.flatMap((item) => {
            const children = childrenMap.get(item.id) || [];
            const levelBadge = `L${Math.min(level + 1, 9)}`;
            return [
                <div
                    key={item.id}
                    className={`relative flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm ${
                        level > 0 ? "ml-6" : ""
                    }`}
                    style={{ marginLeft: level * 14 }}
                >
                    <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-2xl bg-emerald-500/80" />
                    <div className="flex items-center gap-4">
                        <div className="text-slate-300">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                                <circle cx="5" cy="4" r="1.5" />
                                <circle cx="11" cy="4" r="1.5" />
                                <circle cx="5" cy="8" r="1.5" />
                                <circle cx="11" cy="8" r="1.5" />
                                <circle cx="5" cy="12" r="1.5" />
                                <circle cx="11" cy="12" r="1.5" />
                            </svg>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 p-2">
                            {item.logo ? (
                                <img
                                    src={resolveUploadUrl(item.logo)}
                                    alt={item.name}
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                <span className="text-base text-slate-300 font-bold">{item.name[0]}</span>
                            )}
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold text-slate-800">
                                    {item.name}
                                </h3>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                    {item.slug}
                                </span>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    level === 0 ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                                }`}>
                                    {levelBadge}
                                </span>
                            </div>
                            {getParentId(item) ? (
                                <p className="mt-1 text-xs text-slate-400">
                                    Parent: {categoryById.get(getParentId(item))?.name || "—"}
                                </p>
                            ) : null}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() =>
                                setCategoryForm({
                                    id: item.id,
                                    name: item.name,
                                    slug: item.slug,
                                    logo: item.logo || "",
                                    parentId: getParentId(item),
                                    order: item.order || 0,
                                })
                            }
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white hover:shadow-sm"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => deleteCategory(item.id)}
                            className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                        >
                            Delete
                        </button>
                    </div>
                </div>,
                ...renderCategoryTree(children, level + 1),
            ];
        });

    return (
            <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[350px_1fr]">
                {/* Form */}
                <div className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-800">
                        {categoryForm.id ? "Edit Category" : "Add New Category"}
                    </h2>
                    <div className="mt-6 grid gap-4">
                        <label className="grid gap-2 text-sm text-slate-700">
                            <span className="font-semibold text-slate-500">Category Name</span>
                            <input
                                className="rounded-xl border border-slate-200 px-3 py-2"
                                placeholder="e.g. Mitsubishi Electric"
                                value={categoryForm.name}
                                onChange={(event) =>
                                    setCategoryForm((prev) => ({
                                        ...prev,
                                        name: event.target.value,
                                        slug: slugify(event.target.value || prev.slug),
                                    }))
                                }
                            />
                        </label>
                        <label className="grid gap-2 text-sm text-slate-700">
                            <span className="font-semibold text-slate-500">Slug</span>
                            <input
                                className="rounded-xl border border-slate-200 px-3 py-2"
                                placeholder="e.g. mitsubishi-electric"
                                value={categoryForm.slug}
                                onChange={(event) =>
                                    setCategoryForm((prev) => ({
                                        ...prev,
                                        slug: slugify(event.target.value),
                                    }))
                                }
                            />
                        </label>
                        <label className="grid gap-2 text-sm text-slate-700">
                            <span className="font-semibold text-slate-500">Logo</span>
                            <div className="flex gap-4 items-center">
                                {categoryForm.logo && (
                                    <div className="relative h-16 w-16 shrink-0 rounded-lg border border-slate-100 bg-slate-50 p-2">
                                        <img
                                            src={resolveUploadUrl(categoryForm.logo)}
                                            className="h-full w-full object-contain"
                                        />
                                        <button
                                            onClick={() => setCategoryForm(prev => ({ ...prev, logo: "" }))}
                                            className="absolute -top-2 -right-2 rounded-full bg-rose-500 text-white p-1 shadow-sm"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                )}
                                <label className="flex-1 cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-center transition hover:bg-slate-100">
                                    <span className="text-xs text-slate-500">Click to upload logo</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const url = await uploadImage(file);
                                                if (url) setCategoryForm((prev) => ({ ...prev, logo: url }));
                                            }
                                            e.target.value = ""; // Reset to allow re-selecting same file
                                        }}
                                    />
                                </label>
                            </div>
                        </label>
                        <label className="grid gap-2 text-sm text-slate-700">
                            <span className="font-semibold text-slate-500">Parent Category</span>
                            <select
                                className="rounded-xl border border-slate-200 px-3 py-2"
                                value={categoryForm.parentId}
                                onChange={(event) =>
                                    setCategoryForm((prev) => ({
                                        ...prev,
                                        parentId: event.target.value,
                                    }))
                                }
                            >
                                <option value="">No parent (L1)</option>
                                {renderParentOptions(roots, 1)}
                            </select>
                        </label>
                        <label className="grid gap-2 text-sm text-slate-700">
                            <span className="font-semibold text-slate-500">Sort Order</span>
                            <input
                                type="number"
                                className="rounded-xl border border-slate-200 px-3 py-2"
                                value={categoryForm.order}
                                onChange={(event) =>
                                    setCategoryForm((prev) => ({
                                        ...prev,
                                        order: Number(event.target.value || 0),
                                    }))
                                }
                            />
                        </label>

                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={saveCategory}
                                className="flex-1 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                            >
                                {categoryForm.id ? "Update Category" : "Create Category"}
                            </button>
                            {categoryForm.id && (
                                <button
                                    onClick={() =>
                                        setCategoryForm({ id: "", name: "", slug: "", logo: "", parentId: "", order: 0 })
                                    }
                                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-4">
                        <h2 className="text-lg font-semibold text-slate-800">Categories</h2>
                    </div>
                    <div className="grid gap-3 p-4">
                        {renderCategoryTree(roots, 0)}
                        {categories.length === 0 && (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                No categories found. Create one to get started.
                            </div>
                        )}
                    </div>
                </div>
            </div>
    );
}
