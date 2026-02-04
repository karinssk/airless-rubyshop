"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
  title: string;
  slug: string;
  status: string;
  price?: string;
  coverImage?: string;
  category?: { id: string; name: string; slug: string } | null;
};

export default function ServicesByCategoryPage() {
  const params = useParams();
  const slugParam = params.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServiceSummary[]>([]);
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

  const category = useMemo(
    () => categories.find((item) => item.slug === slug),
    [categories, slug]
  );

  const filteredServices = services.filter(
    (service) => service.category?.slug === slug
  );

  if (!slug) {
    return (
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow">
        <p className="text-sm text-slate-500">Category not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {category?.name || "Service Category"}
          </h1>
          <p className="text-sm text-slate-500">/{slug}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/services/categories"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm"
          >
            Back to categories
          </Link>
          <Link
            href="/services/new"
            className="rounded-full bg-blue-600 px-4 py-2 text-sm text-white"
          >
            Add service
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Service</th>
                <th className="px-6 py-4 font-semibold">Price</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredServices.map((service) => (
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
                            alt={service.title}
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
                          {service.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          /services/{service.slug}
                        </div>
                      </div>
                    </div>
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
                      href={`/services/${service.slug}`}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:shadow-sm"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredServices.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No services in this category.
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
