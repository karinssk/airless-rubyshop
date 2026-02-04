"use client";

import { useMemo, useState } from "react";
import ServiceChatButton from "./ServiceChatButton";
type ServiceDetailPanelProps = {
  title: string;
  slug: string;
  price?: string;
};

const parsePriceValue = (value?: string) => {
  if (!value) return 0;
  const match = value.replace(/,/g, "").match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : 0;
};

export default function ServiceDetailPanel({
  title,
  slug,
  price,
}: ServiceDetailPanelProps) {
  const [qty, setQty] = useState(1);
  const basePrice = useMemo(() => parsePriceValue(price), [price]);
  const total = basePrice * qty;

  return (
    <div className="rounded-2xl bg-slate-50 p-5 shadow-lg shadow-black/10">
      <p className="text-xs text-slate-500">จำนวน (ครั้ง):</p>
      <div className="mt-2 inline-flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => setQty((prev) => Math.max(1, prev - 1))}
          className="px-3 py-2 text-lg text-slate-500"
        >
          -
        </button>
        <span className="min-w-[60px] border-x border-slate-200 px-5 py-2 text-center text-sm font-semibold text-slate-700">
          {qty}
        </span>
        <button
          type="button"
          onClick={() => setQty((prev) => prev + 1)}
          className="px-3 py-2 text-lg text-slate-500"
        >
          +
        </button>
      </div>

      <div className="mt-4 rounded-xl bg-white p-4 text-center">
        <p className="text-sm text-slate-500">ยอดชำระทั้งหมด</p>
        <p className="mt-1 text-2xl font-semibold text-slate-800">
          {total ? total.toLocaleString("th-TH") : price || "สอบถามราคา"}
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <ServiceChatButton
          title={title}
          slug={slug}
          price={price}
          qty={qty}
          label="จองบริการ"
          message={`จองบริการ: ${title}${price ? ` (${price})` : ""}\nรายละเอียด: จำนวน ${qty} ครั้ง ราคา ${price || "สอบถามราคา"}`}
          className="rounded-lg bg-[#f25c2a] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20"
        />
      </div>
    </div>
  );
}
