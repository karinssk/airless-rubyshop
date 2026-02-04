"use client";

import { useEffect, useState } from "react";
import { resolveUploadUrl } from "@/lib/urls";

export type SliderImage = {
  url: string;
  caption?: string;
};

export default function ImageSlider({
  images,
  intervalMs = 4000,
}: {
  images: SliderImage[];
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const total = images.length;
  const current = images[index] || images[0];

  useEffect(() => {
    if (index >= total && total > 0) {
      setIndex(0);
    }
  }, [index, total]);

  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % total);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs, total]);

  if (!current) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl shadow-black/10">
      <div className="h-96 w-full">
        <img
          src={resolveUploadUrl(current.url)}
          alt={current.caption || "Slide"}
          className="h-full w-full object-cover"
        />
      </div>
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIndex((prev) => (prev - 1 + total) % total)}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow"
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setIndex((prev) => (prev + 1) % total)}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow"
            aria-label="Next slide"
          >
            ›
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-[11px] text-slate-600">
            {index + 1}/{total}
          </div>
        </>
      )}
      {current.caption && (
        <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-600">
          {current.caption}
        </div>
      )}
    </div>
  );
}
