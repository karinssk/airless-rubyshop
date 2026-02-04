"use client";

import { useMemo, useState } from "react";
import { resolveUploadUrl } from "@/lib/urls";

type ServiceGalleryProps = {
  images: string[];
};

export default function ServiceGallery({ images }: ServiceGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = useMemo(
    () => resolveUploadUrl(images[activeIndex] || images[0]),
    [activeIndex, images]
  );

  if (!images.length) return null;

  return (
    <div className="grid gap-4">
      <div className="relative mx-auto w-full max-w-[640px] aspect-square overflow-hidden rounded-2xl">
        <img
          src={activeImage}
          alt="Service gallery"
          className="h-full w-full object-contain"
        />
        <button
          type="button"
          onClick={() =>
            setActiveIndex((prev) => (prev - 1 + images.length) % images.length)
          }
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 px-3 py-2 text-sm shadow transition hover:scale-105 hover:border-red-300 hover:bg-red-50 hover:text-red-700 hover:shadow-md"
          aria-label="Previous image"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => setActiveIndex((prev) => (prev + 1) % images.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 px-3 py-2 text-sm shadow transition hover:scale-105 hover:border-red-300 hover:bg-red-50 hover:text-red-700 hover:shadow-md"
          aria-label="Next image"
        >
          ›
        </button>
        <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
          {activeIndex + 1}/{images.length}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {images.map((src, index) => (
          <button
            key={`${src}-${index}`}
            onClick={() => setActiveIndex(index)}
            className={`h-16 w-20 overflow-hidden rounded-lg border ${
              index === activeIndex
                ? "border-red-400 ring-2 ring-red-200"
                : "border-slate-200"
            }`}
          >
            <img
              src={resolveUploadUrl(src)}
              alt={`Thumb ${index + 1}`}
              className="h-full w-full object-contain bg-white"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
