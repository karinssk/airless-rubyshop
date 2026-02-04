"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { backendBaseUrl, resolveUploadUrl } from "@/lib/urls";

type SelectedCategory = {
  id: string;
  name: string;
  slug: string;
  logo?: string;
};

type CategoryData = {
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

export default function FeaturedCategories(props: FeaturedCategoriesProps) {
  const locale = useLocale();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const {
    backgroundColor = "",
    heading = "Featured Categories",
    exploreText = "EXPLORE ALL",
    selectedCategories = [],
  } = props;

  useEffect(() => {
    const fetchCategories = async () => {
      if (selectedCategories.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${backendBaseUrl}/product-categories`);
        if (response.ok) {
          const data = await response.json();
          const allCategories = data.categories || [];

          const categoryMap = new Map(allCategories.map((c: CategoryData) => [c.id, c]));
          const orderedCategories = selectedCategories
            .map(sc => categoryMap.get(sc.id))
            .filter(Boolean) as CategoryData[];

          setCategories(orderedCategories);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [selectedCategories]);

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
  }, [categories]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 300);
    }
  };

  const backgroundStyle = backgroundColor ? { backgroundColor } : undefined;

  if (loading) {
    return (
      <section className="py-12" style={backgroundStyle}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800"></div>
            <p className="mt-2 text-sm text-slate-500">กำลังโหลดหมวดหมู่...</p>
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="py-12" style={backgroundStyle}>
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        {heading && (
          <h2 className="mb-8 text-2xl font-bold text-slate-900">{heading}</h2>
        )}

        {/* Categories Slider */}
        <div className="relative">
          {/* Left Arrow */}
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

          {/* Categories Container */}
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-6 overflow-x-auto scroll-smooth pb-4 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/${locale}/products?category=${category.slug}`}
                className="group flex-shrink-0 rounded-xl p-3 transition-all hover:bg-slate-50 hover:shadow-lg"
                style={{ width: "220px" }}
              >
                {/* Category Image */}
                <div className="relative aspect-square overflow-hidden bg-[#f5f5f5]">
                  {category.logo ? (
                    <Image
                      src={resolveUploadUrl(category.logo)}
                      alt={category.name}
                      fill
                      sizes="220px"
                      className="object-contain p-4 transition-transform group-hover:scale-105"
                      unoptimized={resolveUploadUrl(category.logo).includes("localhost")}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <svg
                        className="h-16 w-16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Category Name */}
                <h3 className="mt-4 text-center text-sm font-bold uppercase tracking-wide text-slate-900">
                  {category.name}
                </h3>

                {/* Explore Link */}
                <p className="mt-1 text-center text-xs font-medium uppercase tracking-wider text-slate-500 group-hover:text-slate-700">
                  {exploreText} »
                </p>
              </Link>
            ))}
          </div>

          {/* Right Arrow */}
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

        {/* Progress Bar */}
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
