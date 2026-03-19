"use client";

import { useState } from "react";
import { backendBaseUrl } from "@/lib/urls";

type QuickFromProps = {
  backgroundColor?: string;
  heading?: string;
  phoneLabel?: string;
  submitLabel?: string;
  successMessage?: string;
};

export default function QuickFrom({
  backgroundColor,
  heading,
  phoneLabel,
  submitLabel,
  successMessage,
}: QuickFromProps) {
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const phoneLabelText = phoneLabel || "เบอร์โทรศัพท์";
  const submitLabelText = submitLabel || "ส่งข้อมูล";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${backendBaseUrl}/forms/quick-from`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!response.ok) {
        throw new Error("Failed to submit");
      }
      setPhone("");
      setSuccessOpen(true);
      setTimeout(() => setSuccessOpen(false), 2500);
    } catch {
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
      <div className="mx-auto grid max-w-xl gap-6 px-6">
        {heading ? (
          <h2 className="text-center text-3xl font-semibold text-[var(--brand-navy)]">
            {heading}
          </h2>
        ) : null}
        <form
          onSubmit={submit}
          className="grid gap-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-black/10 backdrop-blur"
        >
          <label className="grid gap-2 text-xs text-slate-700">
            <span className="font-semibold">{phoneLabelText}</span>
            <input
              required
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-sm focus:border-red-400 focus:outline-none"
              placeholder={phoneLabelText}
            />
          </label>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <button
            disabled={submitting}
            className="rounded-2xl bg-[var(--brand-blue)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 disabled:opacity-60"
          >
            {submitting ? "กำลังส่ง..." : submitLabelText}
          </button>
        </form>
      </div>

      {successOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              ✓
            </div>
            <p className="text-sm text-slate-700">
              {successMessage ||
                "ขอบคุณสำหรับข้อมูล เจ้าหน้าที่จะติดต่อกลับภายใน 5 นาที"}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
