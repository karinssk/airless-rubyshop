"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { resolveUploadUrl } from "@/lib/urls";

type ServiceGalleryProps = {
  images: string[];
  youtubeId?: string;
};

type GalleryItem =
  | { type: "image"; src: string }
  | { type: "video"; id: string };

export default function ServiceGallery({ images, youtubeId }: ServiceGalleryProps) {
  const items = useMemo<GalleryItem[]>(() => {
    const next: GalleryItem[] = images.map((src) => ({ type: "image", src }));
    if (youtubeId) {
      next.push({ type: "video", id: youtubeId });
    }
    return next;
  }, [images, youtubeId]);

  const isLocalUrl = (value: string) =>
    value.includes("localhost") || value.includes("127.0.0.1");

  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = items[activeIndex];
  const activeImageSrc =
    activeItem?.type === "image"
      ? resolveUploadUrl(activeItem?.src || images[0])
      : "";
  const [videoLoaded, setVideoLoaded] = useState(false);

  const handleSelect = (index: number) => {
    setActiveIndex(index);
    setVideoLoaded(false);
  };

  if (!items.length) return null;

  return (
    <div className="grid gap-4">
      <div className="relative mx-auto w-full max-w-none aspect-[4/5] sm:aspect-[4/3] lg:aspect-square overflow-hidden rounded-2xl bg-white">
        {activeItem?.type === "video" ? (
          videoLoaded ? (
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${activeItem.id}?autoplay=1`}
              title="Product video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setVideoLoaded(true)}
              className="group relative h-full w-full"
              aria-label="Play video"
            >
              <img
                src={`https://img.youtube.com/vi/${activeItem.id}/mqdefault.jpg`}
                alt="Video thumbnail"
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <span className="absolute inset-0 grid place-items-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 text-white transition group-hover:scale-105">
                  <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
                    <path fill="currentColor" d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </span>
            </button>
          )
        ) : (
          <Image
            src={activeImageSrc}
            alt="Service gallery"
            fill
            sizes="(max-width: 1024px) 100vw, 900px"
            className="object-contain"
            priority
            quality={95}
            unoptimized={activeImageSrc ? isLocalUrl(activeImageSrc) : false}
          />
        )}
        <button
          type="button"
          onClick={() =>
            setActiveIndex((prev) => (prev - 1 + items.length) % items.length)
          }
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 px-3 py-2 text-sm shadow transition hover:scale-105 hover:border-red-300 hover:bg-red-50 hover:text-red-700 hover:shadow-md"
          aria-label="Previous image"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => setActiveIndex((prev) => (prev + 1) % items.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 px-3 py-2 text-sm shadow transition hover:scale-105 hover:border-red-300 hover:bg-red-50 hover:text-red-700 hover:shadow-md"
          aria-label="Next image"
        >
          ›
        </button>
        <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
          {activeIndex + 1}/{items.length}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <button
            key={`${item.type}-${item.type === "image" ? item.src : item.id}-${index}`}
            onClick={() => handleSelect(index)}
            className={`h-20 w-24 overflow-hidden rounded-lg border sm:h-16 sm:w-20 ${
              index === activeIndex
                ? "border-red-400 ring-2 ring-red-200"
                : "border-slate-200"
            } relative`}
          >
            {item.type === "video" ? (
              <div className="relative h-full w-full bg-black">
                <img
                  src={`https://img.youtube.com/vi/${item.id}/mqdefault.jpg`}
                  alt="Video thumbnail"
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white">
                    <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
                      <path fill="currentColor" d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </span>
              </div>
            ) : (
              <Image
                src={resolveUploadUrl(item.src)}
                alt={`Thumb ${index + 1}`}
                fill
                sizes="80px"
                className="object-contain bg-white"
                loading="lazy"
                unoptimized={isLocalUrl(resolveUploadUrl(item.src))}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
