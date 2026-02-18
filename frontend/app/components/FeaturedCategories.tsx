"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { resolveUploadUrl } from "@/lib/urls";

type SelectedCategory = {
  id: string;
  name: string;
  slug: string;
  logo?: string;
};

type FeaturedCategoriesProps = {
  backgroundColor?: string;
  heading?: string;
  exploreText?: string;
  selectedCategories?: SelectedCategory[];
};

export default function FeaturedCategories({
  backgroundColor = "",
  heading = "Featured Categories",
  exploreText = "EXPLORE ALL",
  selectedCategories = [],
}: FeaturedCategoriesProps) {
  const locale = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [selectedCategories]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -280 : 280,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 300);
    }
  };

  if (selectedCategories.length === 0) return null;

  const backgroundStyle = backgroundColor ? { backgroundColor } : undefined;

  return (
    <section className="py-12" style={backgroundStyle}>
      <div className="mx-auto max-w-7xl px-6">
        {heading && (
          <h2 className="mb-8 text-2xl font-bold text-slate-900">{heading}</h2>
        )}

        <div className="relative">
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute -left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white shadow-lg transition-all hover:bg-slate-50"
              aria-label="Scroll left"
            >
              <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-6 overflow-x-auto scroll-smooth pb-4 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {selectedCategories.map((category) => (
              <Link
                key={category.id}
                href={`/${locale}/products/category/${category.slug}`}
                className="group flex-shrink-0 rounded-xl p-3 transition-all hover:bg-slate-50 hover:shadow-lg"
                style={{ width: "220px" }}
              >
                <div className="relative aspect-square overflow-hidden bg-[#f5f5f5]">
                  {category.logo ? (
                    <Image
                      src={resolveUploadUrl(category.logo)}
                      alt={category.name}
                      fill
                      sizes="220px"
                      className="object-contain p-4 transition-transform group-hover:scale-105"
                      unoptimized={resolveUploadUrl(category.logo).includes("localhost")}
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  )}
                </div>

                <h3 className="mt-4 text-center text-sm font-bold uppercase tracking-wide text-slate-900">
                  {category.name}
                </h3>

                <p className="mt-1 text-center text-xs font-medium uppercase tracking-wider text-slate-500 group-hover:text-slate-700">
                  {exploreText} »
                </p>
              </Link>
            ))}
          </div>

          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute -right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white shadow-lg transition-all hover:bg-slate-50"
              aria-label="Scroll right"
            >
              <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-slate-800 transition-all duration-300"
            style={{
              width: scrollRef.current
                ? `${Math.min(100, ((scrollRef.current.scrollLeft + scrollRef.current.clientWidth) / scrollRef.current.scrollWidth) * 100)}%`
                : "20%",
            }}
          />
        </div>
      </div>
    </section>
  );
}
