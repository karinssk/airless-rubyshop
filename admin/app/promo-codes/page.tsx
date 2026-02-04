"use client";

import { useEffect, useState } from "react";
import { backendBaseUrl } from "@/lib/urls";

const API_URL = backendBaseUrl;

type PromoCode = {
  id: string;
  code: string;
  name: { th: string; en: string } | string;
  description: { th: string; en: string } | string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  validFrom: string;
  validTo: string | null;
  maxUses: number | null;
  usedCount: number;
  maxUsesPerUser: number;
  minNights: number;
  minAmount: number;
  applicableRoomTypes: Array<{ id: string; name: any }>;
  isDefault: boolean;
  status: "active" | "inactive";
  internalNotes: string;
  createdAt: string;
  updatedAt: string;
};

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    nameEn: "",
    nameTh: "",
    descriptionEn: "",
    descriptionTh: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: 0,
    validFrom: "",
    validTo: "",
    maxUses: "",
    maxUsesPerUser: 1,
    minNights: 1,
    minAmount: 0,
    isDefault: false,
    status: "active" as "active" | "inactive",
    internalNotes: "",
  });

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const loadPromoCodes = async () => {
    if (!API_URL) {
      setLoading(false);
      return;
    }
    const token = window.localStorage.getItem("adminToken");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/promo-codes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        // Handle unauthorized if needed, e.g., redirect to login
      }
      const data = await res.json();
      setPromoCodes(data.promoCodes || []);
    } catch (error) {
      console.error("Failed to load promo codes:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      nameEn: "",
      nameTh: "",
      descriptionEn: "",
      descriptionTh: "",
      discountType: "percentage",
      discountValue: 0,
      validFrom: "",
      validTo: "",
      maxUses: "",
      maxUsesPerUser: 1,
      minNights: 1,
      minAmount: 0,
      isDefault: false,
      status: "active",
      internalNotes: "",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      code: formData.code.toUpperCase(),
      name: { th: formData.nameTh, en: formData.nameEn },
      description: { th: formData.descriptionTh, en: formData.descriptionEn },
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      validFrom: formData.validFrom || new Date().toISOString(),
      validTo: formData.validTo || null,
      maxUses: formData.maxUses ? Number(formData.maxUses) : null,
      maxUsesPerUser: Number(formData.maxUsesPerUser),
      minNights: Number(formData.minNights),
      minAmount: Number(formData.minAmount),
      isDefault: formData.isDefault,
      status: formData.status,
      internalNotes: formData.internalNotes,
    };

    try {
      const url = editingId
        ? `${API_URL}/promo-codes/${editingId}`
        : `${API_URL}/promo-codes`;
      const method = editingId ? "PUT" : "POST";

      const token = window.localStorage.getItem("adminToken");
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await loadPromoCodes();
        setShowForm(false);
        resetForm();
        alert(
          editingId
            ? "Promo code updated successfully"
            : "Promo code created successfully"
        );
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save promo code");
      }
    } catch (error) {
      console.error("Error saving promo code:", error);
      alert("Failed to save promo code");
    }
  };

  const handleEdit = (promoCode: PromoCode) => {
    const name = typeof promoCode.name === "string" ? { th: promoCode.name, en: promoCode.name } : promoCode.name;
    const description = typeof promoCode.description === "string" ? { th: promoCode.description, en: promoCode.description } : promoCode.description;

    setFormData({
      code: promoCode.code,
      nameEn: name.en || "",
      nameTh: name.th || "",
      descriptionEn: description.en || "",
      descriptionTh: description.th || "",
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue,
      validFrom: promoCode.validFrom ? new Date(promoCode.validFrom).toISOString().split("T")[0] : "",
      validTo: promoCode.validTo ? new Date(promoCode.validTo).toISOString().split("T")[0] : "",
      maxUses: promoCode.maxUses !== null ? String(promoCode.maxUses) : "",
      maxUsesPerUser: promoCode.maxUsesPerUser,
      minNights: promoCode.minNights,
      minAmount: promoCode.minAmount,
      isDefault: promoCode.isDefault,
      status: promoCode.status,
      internalNotes: promoCode.internalNotes || "",
    });
    setEditingId(promoCode.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promo code?")) return;

    try {
      const token = window.localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/promo-codes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await loadPromoCodes();
        alert("Promo code deleted successfully");
      } else {
        alert("Failed to delete promo code");
      }
    } catch (error) {
      console.error("Error deleting promo code:", error);
      alert("Failed to delete promo code");
    }
  };

  const getName = (name: any) => {
    if (typeof name === "string") return name;
    return name?.en || name?.th || "";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Promo Codes</h1>
          <p className="text-sm text-slate-500">
            Manage discount codes for bookings
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "Add Promo Code"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-2xl border border-slate-200 bg-white p-6"
        >
          <h2 className="mb-4 text-lg font-bold text-slate-900">
            {editingId ? "Edit Promo Code" : "Create Promo Code"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="WELCOME10"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Discount Type *
              </label>
              <select
                value={formData.discountType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountType: e.target.value as "percentage" | "fixed",
                  })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (฿)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Discount Value *
              </label>
              <input
                type="number"
                value={formData.discountValue}
                onChange={(e) =>
                  setFormData({ ...formData, discountValue: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder={formData.discountType === "percentage" ? "10" : "500"}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as "active" | "inactive",
                  })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Name (English)
              </label>
              <input
                type="text"
                value={formData.nameEn}
                onChange={(e) =>
                  setFormData({ ...formData, nameEn: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="10% Discount"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Name (Thai)
              </label>
              <input
                type="text"
                value={formData.nameTh}
                onChange={(e) =>
                  setFormData({ ...formData, nameTh: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="ส่วนลด 10%"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Description (English)
              </label>
              <textarea
                value={formData.descriptionEn}
                onChange={(e) =>
                  setFormData({ ...formData, descriptionEn: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                rows={2}
                placeholder="Get 10% off your first booking"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Description (Thai)
              </label>
              <textarea
                value={formData.descriptionTh}
                onChange={(e) =>
                  setFormData({ ...formData, descriptionTh: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                rows={2}
                placeholder="รับส่วนลด 10% สำหรับการจองครั้งแรก"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Valid From
              </label>
              <input
                type="date"
                value={formData.validFrom}
                onChange={(e) =>
                  setFormData({ ...formData, validFrom: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Valid To (Optional)
              </label>
              <input
                type="date"
                value={formData.validTo}
                onChange={(e) =>
                  setFormData({ ...formData, validTo: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Max Uses (Leave empty for unlimited)
              </label>
              <input
                type="number"
                value={formData.maxUses}
                onChange={(e) =>
                  setFormData({ ...formData, maxUses: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="Unlimited"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Min Nights
              </label>
              <input
                type="number"
                value={formData.minNights}
                onChange={(e) =>
                  setFormData({ ...formData, minNights: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                min="1"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) =>
                    setFormData({ ...formData, isDefault: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                Set as default (auto-applied on booking form)
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {editingId ? "Update" : "Create"} Promo Code
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
      ) : promoCodes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-sm text-slate-500">No promo codes yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Create your first promo code
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {promoCodes.map((promo) => (
            <div
              key={promo.id}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      {promo.code}
                    </h3>
                    {promo.isDefault && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                        DEFAULT
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${promo.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                        }`}
                    >
                      {promo.status}
                    </span>
                  </div>
                  <div className="mb-2 text-sm text-slate-600">
                    {getName(promo.name)}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="font-semibold text-blue-600">
                      {promo.discountType === "percentage"
                        ? `${promo.discountValue}% off`
                        : `฿${promo.discountValue} off`}
                    </span>
                    <span>
                      Used: {promo.usedCount}
                      {promo.maxUses !== null && ` / ${promo.maxUses}`}
                    </span>
                    {promo.validTo && (
                      <span>Expires: {formatDate(promo.validTo)}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(promo)}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(promo.id)}
                    className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
