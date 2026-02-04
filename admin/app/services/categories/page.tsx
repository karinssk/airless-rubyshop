"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { backendBaseUrl } from "@/lib/urls";

const API_URL = backendBaseUrl;

type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  order?: number;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function ServiceCategoriesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [categoryForm, setCategoryForm] = useState({
    id: "",
    name: "",
    slug: "",
    order: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadCategories = async () => {
    if (!API_URL) {
      setLoading(false);
      return;
    }
    const response = await fetch(`${API_URL}/service-categories`);
    const data = await response.json();
    setCategories(data.categories || []);
    setLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const saveCategory = async () => {
    if (!API_URL || !categoryForm.name || !categoryForm.slug) return;
    const payload = {
      name: categoryForm.name,
      slug: categoryForm.slug,
      order: categoryForm.order || 0,
    };
    if (categoryForm.id) {
      await fetch(`${API_URL}/service-categories/${categoryForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch(`${API_URL}/service-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setCategoryForm({ id: "", name: "", slug: "", order: 0 });
    loadCategories();
  };

  const deleteCategory = async () => {
    if (!API_URL || !categoryForm.id) return;
    await fetch(`${API_URL}/service-categories/${categoryForm.id}`, {
      method: "DELETE",
    });
    setCategoryForm({ id: "", name: "", slug: "", order: 0 });
    loadCategories();
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Service Categories
          </h1>
          <p className="text-sm text-slate-500">Manage service categories</p>
        </div>
        <Link
          href="/services"
          className="rounded-full border border-slate-200 px-4 py-2 text-sm"
        >
          Back to services
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-slate-800">Categories</h2>
          <div className="mt-4 grid gap-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-slate-700">
                    {category.name}
                  </p>
                  <p className="text-xs text-slate-400">/{category.slug}</p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/services/categories/${category.slug}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
                  >
                    View services
                  </Link>
                  <button
                    onClick={() =>
                      setCategoryForm({
                        id: category.id,
                        name: category.name,
                        slug: category.slug,
                        order: category.order || 0,
                      })
                    }
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
            {categories.length === 0 && !loading && (
              <p className="text-sm text-slate-500">No categories yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-slate-800">Edit Category</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <input
              className="rounded-xl border border-slate-200 px-3 py-2"
              placeholder="Category name"
              value={categoryForm.name}
              onChange={(event) =>
                setCategoryForm((prev) => ({
                  ...prev,
                  name: event.target.value,
                  slug: slugify(event.target.value || prev.slug),
                }))
              }
            />
            <input
              className="rounded-xl border border-slate-200 px-3 py-2"
              placeholder="Slug"
              value={categoryForm.slug}
              onChange={(event) =>
                setCategoryForm((prev) => ({
                  ...prev,
                  slug: slugify(event.target.value),
                }))
              }
            />
            <input
              type="number"
              className="rounded-xl border border-slate-200 px-3 py-2"
              placeholder="Order"
              value={categoryForm.order}
              onChange={(event) =>
                setCategoryForm((prev) => ({
                  ...prev,
                  order: Number(event.target.value || 0),
                }))
              }
            />
            <div className="flex gap-2">
              <button
                onClick={saveCategory}
                className="flex-1 rounded-full bg-blue-600 px-4 py-2 text-xs text-white"
              >
                {categoryForm.id ? "Update" : "Add"}
              </button>
              <button
                onClick={() =>
                  setCategoryForm({ id: "", name: "", slug: "", order: 0 })
                }
                className="rounded-full border border-slate-200 px-4 py-2 text-xs"
              >
                Clear
              </button>
            </div>
            {categoryForm.id && (
              <button
                onClick={deleteCategory}
                className="rounded-full bg-rose-100 px-4 py-2 text-xs text-rose-700"
              >
                Delete Category
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
