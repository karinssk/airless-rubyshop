"use client";

import { useEffect, useState } from "react";
import { resolveUploadUrl } from "@/lib/urls";

export type SliderImage = {
  url: string;
  caption?: string;
};

export default function ImageSlider({
  images,
  intervalMs = 0,
}: {
  images: SliderImage[];
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const total = images.length;
  const current = images[index] || images[0];
  const lightboxImage = images[lightboxIndex] || images[0];

  useEffect(() => {
    if (index >= total && total > 0) {
      setIndex(0);
    }
  }, [index, total]);

  useEffect(() => {
    if (total <= 1 || intervalMs <= 0) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % total);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs, total]);

  if (!current) return null;

  const goPrev = () => setIndex((prev) => (prev - 1 + total) % total);
  const goNext = () => setIndex((prev) => (prev + 1) % total);
  const goPrevLightbox = () =>
    setLightboxIndex((prev) => (prev - 1 + total) % total);
  const goNextLightbox = () =>
    setLightboxIndex((prev) => (prev + 1) % total);

  const handleTouchStart = (event: React.TouchEvent) => {
    if (event.touches.length !== 1) return;
    setTouchStartX(event.touches[0].clientX);
    setTouchDeltaX(0);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (touchStartX === null || event.touches.length !== 1) return;
    setTouchDeltaX(event.touches[0].clientX - touchStartX);
  };

  const handleTouchEnd = (onPrev: () => void, onNext: () => void) => {
    if (touchStartX === null) return;
    const threshold = 50;
    if (touchDeltaX > threshold) onPrev();
    if (touchDeltaX < -threshold) onNext();
    setTouchStartX(null);
    setTouchDeltaX(0);
  };

  return (
    <div className="relative mx-auto w-full max-w-[800px] overflow-hidden rounded-3xl bg-white shadow-xl shadow-black/10">
      <button
        type="button"
        className="aspect-square w-full"
        onClick={() => {
          setLightboxIndex(index);
          setIsOpen(true);
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => handleTouchEnd(goPrev, goNext)}
        aria-label="Open image"
      >
        <img
          src={resolveUploadUrl(current.url)}
          alt={current.caption || "Slide"}
          className="h-full w-full object-contain"
        />
      </button>
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20"
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20"
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
      {isOpen && lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-10"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => handleTouchEnd(goPrevLightbox, goNextLightbox)}
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-full bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20"
              aria-label="Close"
            >
              ✕
            </button>
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrevLightbox}
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20"
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={goNextLightbox}
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20"
                  aria-label="Next image"
                >
                  ›
                </button>
              </>
            )}
            <div className="rounded-2xl bg-white">
              <img
                src={resolveUploadUrl(lightboxImage.url)}
                alt={lightboxImage.caption || "Slide"}
                className="max-h-[80vh] w-full object-contain"
              />
              {lightboxImage.caption && (
                <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-600">
                  {lightboxImage.caption}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
