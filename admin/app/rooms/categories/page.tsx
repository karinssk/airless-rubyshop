"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { backendBaseUrl } from "@/lib/urls";

const API_URL = backendBaseUrl;

type RoomCategory = {
  id: string;
  name: { th: string; en: string } | string;
  slug: string;
  description: { th: string; en: string } | string;
  order: number;
  createdAt: string;
};

export default function RoomCategoriesPage() {
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [nameEn, setNameEn] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [slug, setSlug] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionTh, setDescriptionTh] = useState("");
  const [order, setOrder] = useState(0);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/room-categories`);
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNameEn("");
    setNameTh("");
    setSlug("");
    setDescriptionEn("");
    setDescriptionTh("");
    setOrder(0);
    setEditingId(null);
  };

  const handleEdit = (category: RoomCategory) => {
    const name = typeof category.name === "string"
      ? { en: category.name, th: category.name }
      : category.name;
    const description = typeof category.description === "string"
      ? { en: category.description, th: category.description }
      : category.description;

    setNameEn(name?.en || "");
    setNameTh(name?.th || "");
    setSlug(category.slug);
    setDescriptionEn(description?.en || "");
    setDescriptionTh(description?.th || "");
    setOrder(category.order);
    setEditingId(category.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: { th: nameTh, en: nameEn },
      slug,
      description: { th: descriptionTh, en: descriptionEn },
      order,
    };

    try {
      const url = editingId
        ? `${API_URL}/room-categories/${editingId}`
        : `${API_URL}/room-categories`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await loadCategories();
        setShowForm(false);
        resetForm();
        alert(
          editingId
            ? "Category updated successfully"
            : "Category created successfully"
        );
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save category");
      }
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Failed to save category");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const res = await fetch(`${API_URL}/room-categories/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await loadCategories();
        alert("Category deleted successfully");
      } else {
        alert("Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category");
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const getName = (name: any) => {
    if (typeof name === "string") return name;
    return name?.en || name?.th || "";
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/rooms"
            className="mb-2 inline-block text-sm text-blue-600 hover:text-blue-700"
          >
            ← Back to rooms
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Room Categories</h1>
          <p className="text-sm text-slate-500">Organize your rooms by category</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "Add Category"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-2xl border border-slate-200 bg-white p-6"
        >
          <h2 className="mb-4 text-lg font-bold text-slate-900">
            {editingId ? "Edit Category" : "Create Category"}
          </h2>
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Name (English) *
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => {
                    setNameEn(e.target.value);
                    if (!slug && !editingId) {
                      setSlug(generateSlug(e.target.value));
                    }
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                  placeholder="Deluxe"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Name (Thai)
                </label>
                <input
                  type="text"
                  value={nameTh}
                  onChange={(e) => setNameTh(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                  placeholder="ห้องดีลักซ์"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Slug (URL) *
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                  placeholder="deluxe"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Order
                </label>
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Description (English)
              </label>
              <textarea
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                rows={2}
                placeholder="Premium rooms with extra amenities"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Description (Thai)
              </label>
              <textarea
                value={descriptionTh}
                onChange={(e) => setDescriptionTh(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                rows={2}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {editingId ? "Update" : "Create"} Category
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          Loading...
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-sm text-slate-500">No categories yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Create your first category
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">
                  {getName(category.name)}
                </h3>
                <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5">
                    {category.slug}
                  </span>
                  <span>Order: {category.order}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
