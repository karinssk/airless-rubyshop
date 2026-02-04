"use client";

import { useState } from "react";

export type HeroSlide = {
  image: string;
  title?: string;
  subtitle?: string;
  description?: string;
};

export default function HeroSlider({
  slides,
  imageFit = "contain",
}: {
  slides: HeroSlide[];
  imageFit?: "contain" | "cover" | "fill";
}) {
  const [index, setIndex] = useState(0);
  const total = slides.length;
  const current = slides[index] || slides[0];

  if (!current) return null;

  const goPrev = () =>
    setIndex((prev) => (prev - 1 + total) % total);
  const goNext = () => setIndex((prev) => (prev + 1) % total);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-none bg-white">
      <img
        src={current.image}
        alt={current.title || "Hero slide"}
        className={`h-full w-full object-${imageFit}`}
      />
      <div className="absolute inset-0 bg-transparent" />
      <button
        onClick={goPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow"
        aria-label="Previous slide"
      >
        ‹
      </button>
      <button
        onClick={goNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow"
        aria-label="Next slide"
      >
        ›
      </button>
      <div className="absolute bottom-4 right-4 rounded-full bg-white/80 px-3 py-1 text-[11px] text-slate-600">
        {index + 1}/{total}
      </div>
    </div>
  );
}
