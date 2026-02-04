"use client";

import { useState } from "react";
import { backendBaseUrl } from "@/lib/urls";

type RequestQuotationFormProps = {
  backgroundColor?: string;
  heading?: string;
  subheading?: string;
  nameLabel?: string;
  companyLabel?: string;
  emailLabel?: string;
  phoneLabel?: string;
  serviceLabel?: string;
  detailsLabel?: string;
  submitLabel?: string;
  submitNote?: string;
  successTitle?: string;
  successMessage?: string;
  services?: string[];
};

export default function RequestQuotationForm({
  backgroundColor,
  heading,
  subheading,
  nameLabel,
  companyLabel,
  emailLabel,
  phoneLabel,
  serviceLabel,
  detailsLabel,
  submitLabel,
  submitNote,
  successTitle,
  successMessage,
  services,
}: RequestQuotationFormProps) {
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    service: "",
    details: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${backendBaseUrl}/forms/quotation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        throw new Error("Failed to submit");
      }
      setForm({
        name: "",
        company: "",
        email: "",
        phone: "",
        service: "",
        details: "",
      });
      setSuccessOpen(true);
      setTimeout(() => setSuccessOpen(false), 2500);
    } catch (err) {
      setError("ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className="py-16"
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      <div className="mx-auto grid max-w-4xl gap-8 px-6">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
            {heading}
          </h2>
          <p className="mt-2 text-sm text-[var(--brand-blue)]">
            {subheading}
          </p>
        </div>
        <form
          onSubmit={submit}
          className="grid gap-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-black/10 backdrop-blur"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-xs text-slate-700">
              <span className="font-semibold">{nameLabel}</span>
              <input
                required
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-sm focus:border-red-400 focus:outline-none"
                placeholder={nameLabel}
              />
            </label>
            <label className="grid gap-2 text-xs text-slate-700">
              <span className="font-semibold">{companyLabel}</span>
              <input
                value={form.company}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, company: event.target.value }))
                }
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-sm focus:border-red-400 focus:outline-none"
                placeholder={companyLabel}
              />
            </label>
            <label className="grid gap-2 text-xs text-slate-700">
              <span className="font-semibold">{emailLabel}</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-sm focus:border-red-400 focus:outline-none"
                placeholder={emailLabel}
              />
            </label>
            <label className="grid gap-2 text-xs text-slate-700">
              <span className="font-semibold">{phoneLabel}</span>
              <input
                required
                value={form.phone}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, phone: event.target.value }))
                }
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-sm focus:border-red-400 focus:outline-none"
                placeholder={phoneLabel}
              />
            </label>
          </div>
          <label className="grid gap-2 text-xs text-slate-700">
            <span className="font-semibold">{serviceLabel}</span>
            <select
              required
              value={form.service}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, service: event.target.value }))
              }
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-sm focus:border-red-400 focus:outline-none"
            >
              <option value="">{serviceLabel}</option>
              {(services || []).map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-xs text-slate-700">
            <span className="font-semibold">{detailsLabel}</span>
            <textarea
              value={form.details}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, details: event.target.value }))
              }
              className="min-h-[140px] rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-sm focus:border-red-400 focus:outline-none"
              placeholder={detailsLabel}
            />
          </label>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <button
            disabled={submitting}
            className="rounded-2xl bg-[var(--brand-blue)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 disabled:opacity-60"
          >
            {submitting ? "กำลังส่ง..." : submitLabel}
          </button>
          <p className="text-center text-xs text-slate-500">{submitNote}</p>
        </form>
      </div>

      {successOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              ✓
            </div>
            <p className="text-lg font-semibold text-slate-800">
              {successTitle}
            </p>
            <p className="mt-2 text-sm text-slate-500">{successMessage}</p>
          </div>
        </div>
      )}
    </section>
  );
}
