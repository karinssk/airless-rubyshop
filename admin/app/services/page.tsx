"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { backendBaseUrl, resolveUploadUrl } from "@/lib/urls";

const API_URL = backendBaseUrl;

type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
};

type ServiceSummary = {
  id: string;
  title: string | Record<string, string> | null;
  slug: string;
  status: string;
  price?: string;
  coverImage?: string;
  category?: { id: string; name: string; slug: string } | null;
};

const getDisplayText = (value: ServiceSummary["title"]) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  const localized =
    value.th ??
    value.en ??
    Object.values(value).find((item) => typeof item === "string" && item.trim());
  return typeof localized === "string" ? localized : "";
};

export default function ServicesList() {
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!API_URL) {
        setLoading(false);
        return;
      }
      const [serviceRes, categoryRes] = await Promise.all([
        fetch(`${API_URL}/services`),
        fetch(`${API_URL}/service-categories`),
      ]);
      const serviceData = await serviceRes.json();
      const categoryData = await categoryRes.json();
      setServices(serviceData.services || []);
      setCategories(categoryData.categories || []);
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredServices = services.filter((service) => {
    const titleText = getDisplayText(service.title);
    const searchText = search.toLowerCase();
    const matchesSearch =
      titleText.toLowerCase().includes(searchText) ||
      service.slug.toLowerCase().includes(searchText);
    const matchesCategory =
      filterCategory === "all" || service.category?.slug === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Services</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage service listings and editor pages
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Link
            href="/services/categories"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Categories
          </Link>
          <Link
            href="/services/new"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-full bg-blue-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md shadow-blue-200 hover:bg-blue-700"
          >
            Add Service
          </Link>
        </div>
      </div>

      <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center">
        <input
          placeholder="Search services..."
          className="w-full rounded-xl sm:rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm outline-none focus:border-blue-500 md:flex-1"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm outline-none focus:border-blue-500"
          value={filterCategory}
          onChange={(event) => setFilterCategory(event.target.value)}
        >
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Mobile Card View */}
      <div className="space-y-3 md:hidden">
        {filteredServices.map((service) => {
          const titleText = getDisplayText(service.title) || "Untitled service";
          return (
            <div
              key={service.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              {/* Header with Image and Status */}
              <div className="mb-3 flex items-start gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                  {service.coverImage ? (
                    <img
                      src={resolveUploadUrl(service.coverImage)}
                      alt={titleText}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-300">
                      img
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm mb-1 truncate">
                    {titleText}
                  </h3>
                  <div className="text-xs text-slate-500 mb-2">
                    /services/{service.slug}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold ${
                      service.status === "published"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        service.status === "published"
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      }`}
                    />
                    {service.status === "published" ? "Published" : "Draft"}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 p-3">
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">
                    CATEGORY
                  </div>
                  {service.category ? (
                    <span className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600 border border-slate-200">
                      {service.category.name}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-500 mb-1">
                    PRICE
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    {service.price || "-"}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <Link
                href={`/services/${service.id}`}
                className="block text-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Edit Service
              </Link>
            </div>
          );
        })}
        {filteredServices.length === 0 && !loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-xs text-slate-500">No services found.</p>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Service</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Price</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredServices.map((service) => {
                const titleText = getDisplayText(service.title) || "Untitled service";
                return (
                  <tr
                    key={service.id}
                    className="transition hover:bg-slate-50/50"
                  >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                        {service.coverImage ? (
                          <img
                            src={resolveUploadUrl(service.coverImage)}
                            alt={titleText}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-slate-300">
                            img
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {titleText}
                        </div>
                        <div className="text-xs text-slate-500">
                          /services/{service.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {service.category ? (
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                        {service.category.name}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {service.price || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold ${
                        service.status === "published"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          service.status === "published"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                      />
                      {service.status === "published" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/services/${service.id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:shadow-sm"
                    >
                      Edit
                    </Link>
                  </td>
                  </tr>
                );
              })}
              {filteredServices.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No services found.
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
