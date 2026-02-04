"use client";

import { useState } from "react";
import { resolveUploadUrl } from "@/lib/urls";

type GalleryItem = {
  url?: string;
  caption?: string;
};

const thumbFor = (url?: string) => {
  if (!url) return "";
  const base = url.endsWith(".webp") ? url.replace(/\.webp$/i, "_thumb.webp") : url;
  return resolveUploadUrl(base);
};

export default function GalleryLightbox({ items }: { items: GalleryItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const open = (index: number) => setActiveIndex(index);
  const close = () => setActiveIndex(null);
  const next = () =>
    setActiveIndex((prev) =>
      prev === null ? prev : (prev + 1) % items.length
    );
  const prev = () =>
    setActiveIndex((prev) =>
      prev === null ? prev : (prev - 1 + items.length) % items.length
    );

  const active = activeIndex !== null ? items[activeIndex] : null;

  return (
    <>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {items.map((item, index) => (
          <button
            type="button"
            key={`${item.url}-${index}`}
            onClick={() => open(index)}
            className="group overflow-hidden rounded-2xl bg-white shadow"
          >
            {item.url ? (
              <img
                src={thumbFor(item.url)}
                alt={item.caption || "gallery"}
                className="h-48 w-full object-cover transition duration-200 group-hover:scale-105"
              />
            ) : (
              <div className="h-48 w-full bg-slate-100" />
            )}
            <div className="px-4 py-3 text-left text-sm text-slate-600">
              {item.caption}
            </div>
          </button>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="relative w-full max-w-4xl rounded-3xl bg-white p-4 shadow-2xl">
            <button
              onClick={close}
              className="absolute right-4 top-4 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              Close
            </button>
            <div className="relative">
              <img
                src={resolveUploadUrl(active.url || "")}
                alt={active.caption || "gallery"}
                className="max-h-[70vh] w-full rounded-2xl object-contain"
              />
              <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow"
              >
                ‹
              </button>
              <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow"
              >
                ›
              </button>
            </div>
            {active.caption && (
              <p className="mt-3 text-sm text-slate-600">{active.caption}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
