"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useRef, useState } from "react";
import type { Block } from "./types";
import { safeText } from "./utils";
import { resolveUploadUrl } from "@/lib/urls";
import { HlsVideoPlayer } from "./HlsVideoPlayer";

type LivePreviewProps = {
  blocks: Block[];
  activeIndex: number | null;
  background?: string;
  onSelect: (index: number) => void;
  onElementSelect: (label: string) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
  onUpdateBlock: (index: number, patch: Record<string, unknown>) => void;
  onRemoveBlock: (index: number) => void;
  dropTarget: { index: number; position: "before" | "after" } | null;
  onDropHover: (index: number, position: "before" | "after") => void;
};

const pickReadableTextColor = (value: string, fallback: string) => {
  const trimmed = value.trim();
  const match = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return fallback;
  const hex = match[1].length === 3
    ? match[1]
      .split("")
      .map((char) => char + char)
      .join("")
    : match[1];
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance >= 0.6 ? trimmed : fallback;
};

const resolvePreviewImage = (value?: string) =>
  resolveUploadUrl(safeText(value));

const extractMapEmbedSrc = (value?: string) => {
  const raw = safeText(value).trim();
  const match = raw.match(/<iframe[^>]*src=["']([^"']+)["']/i);
  return match ? match[1] : raw;
};

const isEmbeddableMapUrl = (value: string) =>
  /google\.com\/maps\/embed\?/i.test(value);

const isProbablyImage = (value: string) =>
  /^(https?:|\/|uploads\/)/i.test(value);

const extractYouTubeId = (value?: string) => {
  const raw = safeText(value).trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace("/", "");
    }
    if (url.hostname.includes("youtube.com")) {
      if (url.searchParams.get("v")) return url.searchParams.get("v") || "";
      const paths = url.pathname.split("/").filter(Boolean);
      const embedIndex = paths.indexOf("embed");
      if (embedIndex !== -1 && paths[embedIndex + 1]) {
        return paths[embedIndex + 1];
      }
      const shortsIndex = paths.indexOf("shorts");
      if (shortsIndex !== -1 && paths[shortsIndex + 1]) {
        return paths[shortsIndex + 1];
      }
    }
  } catch {
    return "";
  }
  return "";
};

function ImageSliderPreview({
  images,
  onCaptionChange,
}: {
  images: Array<Record<string, string>>;
  onCaptionChange: (index: number, value: string) => void;
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
    }, 4000);
    return () => clearInterval(timer);
  }, [total]);

  if (!current) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
        No images yet
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl shadow-blue-900/10">
      <div className="h-96 w-full">
        <img
          src={resolvePreviewImage(current.url)}
          alt={safeText(current.caption)}
          className="h-full w-full object-cover"
        />
      </div>
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
      <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-600">
        <EditableText
          value={safeText(current.caption)}
          onCommit={(value) => onCaptionChange(index, value)}
          className="text-slate-600"
          multiline
        />
      </div>
    </div>
  );
}

export function LivePreview({
  blocks,
  activeIndex,
  background,
  onSelect,
  onElementSelect,
  onReorder,
  onUpdateBlock,
  onRemoveBlock,
  dropTarget,
  onDropHover,
}: LivePreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedElementRef = useRef<HTMLElement | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  const buildLabel = (element: HTMLElement) => {
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : "";
    const className = element.className
      ? `.${String(element.className).split(" ")[0]}`
      : "";
    return `${tag}${id}${className}`;
  };

  const buildBreadcrumb = (element: HTMLElement) => {
    const parts: string[] = [];
    let current: HTMLElement | null = element;
    let depth = 0;
    while (current && depth < 4 && current !== containerRef.current) {
      parts.unshift(buildLabel(current));
      current = current.parentElement;
      depth += 1;
    }
    return parts.join(" > ");
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (!target || !containerRef.current?.contains(target)) return;

    if (selectedElementRef.current) {
      selectedElementRef.current.removeAttribute("data-preview-selected");
    }
    target.setAttribute("data-preview-selected", "true");
    selectedElementRef.current = target;
    onElementSelect(buildBreadcrumb(target));

    const section = target.closest("[data-block-index]") as HTMLElement | null;
    if (section) {
      const index = Number(section.dataset.blockIndex);
      if (!Number.isNaN(index)) {
        onSelect(index);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!event.over) return;
    const activeId = String(event.active.id);
    const overId = String(event.over?.id);
    const oldIndex = blocks.findIndex((block) => block.uid === activeId);
    const newIndex = blocks.findIndex((block) => block.uid === overId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    onReorder(oldIndex, newIndex);
  };

  const renderBlock = (block: Block | undefined, index: number) => {
    if (!block || !block.props) return null;
    const props = block.props as Record<string, any>;
    const updateItem = (
      key: string,
      itemIndex: number,
      patch: Record<string, unknown>
    ) => {
      const items = (props[key] || []) as Array<Record<string, unknown>>;
      const nextItems = items.map((item, idx) =>
        idx === itemIndex ? { ...item, ...patch } : item
      );
      onUpdateBlock(index, { [key]: nextItems });
    };
    const wrap = (content: React.ReactNode) => (
      <SortablePreviewSection
        key={`${block.uid}-preview`}
        id={block.uid}
        index={index}
        active={activeIndex === index}
        onSelect={onSelect}
        onDelete={onRemoveBlock}
        dropTarget={dropTarget}
        onDropHover={onDropHover}
      >
        {content}
      </SortablePreviewSection>
    );

    if (block.type === "hero") {
      const backgroundColor = safeText(props.backgroundColor);
      const heroImage = resolveUploadUrl(safeText(props.backgroundImage));
      return wrap(
        <header
          className="relative overflow-hidden"
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-10 pt-8 sm:px-6 sm:pb-12 sm:pt-10 lg:flex-row lg:items-center lg:gap-10 lg:pb-16">
            <div className="max-w-xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1 text-xs font-semibold text-[var(--brand-navy)]">
                <span className="h-2 w-2 rounded-full bg-[var(--brand-orange)]" />
                <EditableText
                  value={safeText(props.subtitle)}
                  onCommit={(value) => onUpdateBlock(index, { subtitle: value })}
                />
              </div>
              <h1 className="text-3xl font-semibold leading-tight text-[var(--brand-navy)] sm:text-4xl lg:text-5xl">
                <EditableText
                  value={safeText(props.title)}
                  onCommit={(value) => onUpdateBlock(index, { title: value })}
                  className="text-[var(--brand-navy)]"
                />
              </h1>
              <p className="text-sm text-slate-700 sm:text-base lg:text-lg">
                <EditableText
                  value={safeText(props.description)}
                  onCommit={(value) =>
                    onUpdateBlock(index, { description: value })
                  }
                  className="text-slate-700"
                  multiline
                />
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <span className="rounded-full bg-[var(--brand-blue)] px-5 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-blue-900/20 sm:px-6 sm:py-3">
                  <EditableText
                    value={safeText(props.primaryCtaText) || "จองคิว"}
                    onCommit={(value) =>
                      onUpdateBlock(index, { primaryCtaText: value })
                    }
                    className="text-white"
                  />
                </span>
                <span className="rounded-full border border-[var(--brand-blue)] px-5 py-2.5 text-center text-sm font-semibold text-[var(--brand-blue)] sm:px-6 sm:py-3">
                  <EditableText
                    value={safeText(props.secondaryCtaText) || "ดูรายละเอียด"}
                    onCommit={(value) =>
                      onUpdateBlock(index, { secondaryCtaText: value })
                    }
                    className="text-[var(--brand-blue)]"
                  />
                </span>
              </div>
            </div>
            <div className="relative flex-1">
              <div className="absolute -right-8 -top-6 h-32 w-32 rounded-full bg-white/70 blur-xl" />
              <div className="overflow-hidden rounded-3xl bg-white/90 shadow-2xl shadow-blue-900/15 backdrop-blur">
                {heroImage ? (
                  <img
                    src={heroImage}
                    alt={safeText(props.title) || "Hero image"}
                    className="h-64 w-full object-cover sm:h-72 lg:h-80"
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center text-sm text-slate-400 sm:h-72 lg:h-80">
                    No hero image
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      );
    }

    if (block.type === "landing-hero-01") {
      const backgroundImage = resolvePreviewImage(props.backgroundImage);
      const backgroundImageMobile = resolvePreviewImage(props.backgroundImageMobile);
      const overlayOpacity = Math.min(
        0.85,
        Math.max(0.2, Number(props.overlayOpacity) || 0.55)
      );
      const logoUrl = resolvePreviewImage(props.logoUrl);
      return wrap(
        <section className="relative min-h-[300px] overflow-hidden aspect-[4/5] sm:aspect-[4/5] md:aspect-auto sm:min-h-[380px] lg:min-h-[600px]">
          {backgroundImageMobile ? (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center md:hidden"
                style={{ backgroundImage: `url(${backgroundImageMobile})` }}
              />
              <div
                className="absolute inset-0 hidden bg-cover bg-center md:block"
                style={{ backgroundImage: `url(${backgroundImage})` }}
              />
            </>
          ) : backgroundImage ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${backgroundImage})` }}
            />
          ) : null}
          <div
            className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/70 to-transparent"
            style={{ opacity: overlayOpacity }}
          />
          <div className="absolute inset-0">
            <div className="mx-auto flex h-full max-w-6xl flex-col items-start justify-end gap-4 px-4 pb-8 pt-6 text-left text-white sm:gap-6 sm:px-6 sm:pb-12 sm:pt-8 lg:pb-16">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-10 w-auto object-contain"
                />
              ) : null}
              <div className="max-w-[520px] space-y-3 sm:space-y-4">
                <h1 className="text-2xl font-semibold leading-tight drop-shadow sm:text-4xl lg:text-5xl">
                  <EditableText
                    value={safeText(props.title)}
                    onCommit={(value) => onUpdateBlock(index, { title: value })}
                    className="text-white whitespace-pre-line"
                    multiline
                  />
                </h1>
                <p className="text-xs text-white/80 drop-shadow sm:text-base whitespace-pre-line">
                  <EditableText
                    value={safeText(props.description)}
                    onCommit={(value) =>
                      onUpdateBlock(index, { description: value })
                    }
                    className="text-white/80 whitespace-pre-line"
                    multiline
                  />
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <span className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold shadow-lg shadow-black/20 sm:px-5 sm:py-3 sm:text-sm">
                    <EditableText
                      value={safeText(props.buttonText)}
                      onCommit={(value) =>
                        onUpdateBlock(index, { buttonText: value })
                      }
                      className="text-white"
                    />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "hero-images") {
      const backgroundColor = safeText(props.backgroundColor);
      const images = (props.images || []) as Array<Record<string, string>>;
      return wrap(
        <section
          className="py-8"
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          <HeroImagesPreview images={images} />
        </section>
      );
    }

    if (block.type === "youtube-embed") {
      const heading = safeText(props.heading);
      const videoId = extractYouTubeId(props.videoUrl);
      const embedUrl = videoId
        ? `https://www.youtube.com/embed/${videoId}`
        : "";
      return wrap(
        <section className="py-16">
          <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6">
            <h2 className="text-center text-2xl font-semibold text-[var(--brand-navy)]">
              <EditableText
                value={heading}
                onCommit={(value) => onUpdateBlock(index, { heading: value })}
                className="text-[var(--brand-navy)]"
              />
            </h2>
            <div className="relative w-full overflow-hidden rounded-3xl bg-slate-100 shadow-xl shadow-slate-900/10">
              {embedUrl ? (
                <iframe
                  title={heading || "YouTube Video"}
                  src={embedUrl}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex aspect-video items-center justify-center text-sm text-slate-400">
                  Paste a valid YouTube URL to preview the video.
                </div>
              )}
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "video-hls-01") {
      const heading = safeText(props.heading);
      const description = safeText(props.description);
      const backgroundColor = safeText(props.backgroundColor) || "#ffffff";
      const hlsDesktop = resolvePreviewImage(
        (props.hlsUrlDesktop || props.hlsUrl) as string
      );
      const hlsMobile = resolvePreviewImage(
        (props.hlsUrlMobile || props.hlsUrl) as string
      );
      const posterImage = resolvePreviewImage(props.posterImage);
      return wrap(
        <section className="py-16" style={{ backgroundColor }}>
          <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-semibold text-[var(--brand-navy)]">
                <EditableText
                  value={heading}
                  onCommit={(value) => onUpdateBlock(index, { heading: value })}
                  className="text-[var(--brand-navy)]"
                />
              </h2>
              <p className="text-sm text-slate-600">
                <EditableText
                  value={description}
                  onCommit={(value) =>
                    onUpdateBlock(index, { description: value })
                  }
                  className="text-slate-600"
                  multiline
                />
              </p>
            </div>
          </div>
          <div className="mt-6">
            <div className="mx-auto w-full max-w-5xl px-6 md:max-w-none md:px-0">
              <div className="grid gap-4 md:grid-cols-2 md:rounded-none">
                <div className="overflow-hidden rounded-3xl bg-slate-900/10 shadow-xl shadow-slate-900/10">
                  <div className="border-b border-slate-200/60 px-4 py-2 text-xs font-semibold text-slate-600">
                    Desktop
                  </div>
                {hlsDesktop ? (
                  <HlsVideoPlayer
                    src={hlsDesktop}
                    poster={posterImage}
                    className="aspect-video w-full"
                  />
                  ) : (
                    <div className="flex aspect-video items-center justify-center text-sm text-slate-400">
                      Upload a desktop video.
                    </div>
                  )}
                </div>
                <div className="overflow-hidden rounded-3xl bg-slate-900/10 shadow-xl shadow-slate-900/10">
                  <div className="border-b border-slate-200/60 px-4 py-2 text-xs font-semibold text-slate-600">
                    Mobile
                  </div>
                {hlsMobile ? (
                  <div className="mx-auto w-full max-w-[320px]">
                    <HlsVideoPlayer
                      src={hlsMobile}
                      poster={posterImage}
                      className="aspect-[9/16] w-full"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-video items-center justify-center text-sm text-slate-400">
                    Upload a mobile video.
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "customer-reviews-images") {
      const heading = safeText(props.heading);
      const imageLeft = resolvePreviewImage(props.imageLeft);
      const imageRight = resolvePreviewImage(props.imageRight);
      return wrap(
        <section className="py-16">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6">
            <h2 className="text-center text-2xl font-semibold text-[var(--brand-navy)]">
              <EditableText
                value={heading}
                onCommit={(value) => onUpdateBlock(index, { heading: value })}
                className="text-[var(--brand-navy)]"
              />
            </h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="overflow-hidden rounded-3xl bg-slate-100 shadow-lg shadow-slate-900/10">
                {imageLeft ? (
                  <img
                    src={imageLeft}
                    alt="Customer review 1"
                    className="aspect-[4/5] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/5] items-center justify-center text-sm text-slate-400">
                    Upload left image
                  </div>
                )}
              </div>
              <div className="overflow-hidden rounded-3xl bg-slate-100 shadow-lg shadow-slate-900/10">
                {imageRight ? (
                  <img
                    src={imageRight}
                    alt="Customer review 2"
                    className="aspect-[4/5] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/5] items-center justify-center text-sm text-slate-400">
                    Upload right image
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "hero-with-available-rooms-check") {
      const backgroundImage = resolvePreviewImage(props.backgroundImage);
      return wrap(
        <section className="relative overflow-hidden bg-slate-900 text-slate-50">
          {backgroundImage && (
            <div
              className="absolute inset-0 -z-10 bg-cover bg-center opacity-40"
              style={{ backgroundImage: `url(${backgroundImage})` }}
            />
          )}
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/80" />
          <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-50/90">
                <EditableText
                  value={safeText(props.subtitle)}
                  onCommit={(value) => onUpdateBlock(index, { subtitle: value })}
                  className="text-slate-50/90"
                />
              </p>
              <h2 className="text-3xl font-semibold text-slate-50">
                <EditableText
                  value={safeText(props.title)}
                  onCommit={(value) => onUpdateBlock(index, { title: value })}
                  className="text-slate-50"
                />
              </h2>
              <p className="text-sm text-slate-50/80">
                <EditableText
                  value={safeText(props.description)}
                  onCommit={(value) =>
                    onUpdateBlock(index, { description: value })
                  }
                  className="text-slate-50/80"
                  multiline
                />
              </p>
            </div>
            <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-xl">
              <p className="text-xs font-semibold text-slate-600">
                <EditableText
                  value={safeText(props.overlayTitle)}
                  onCommit={(value) =>
                    onUpdateBlock(index, { overlayTitle: value })
                  }
                  className="text-slate-600"
                />
              </p>
              <div className="mt-3 grid gap-2 text-xs text-slate-500">
                <div className="rounded-xl border border-slate-200 px-3 py-2">
                  Check-in date
                </div>
                <div className="rounded-xl border border-slate-200 px-3 py-2">
                  Check-out date
                </div>
                <div
                  className="rounded-xl px-3 py-2 text-center text-xs font-semibold"
                  style={{
                    backgroundColor: safeText(props.buttonBackground) || "#2563eb",
                    color: safeText(props.buttonTextColor) || "#ffffff",
                  }}
                >
                  <EditableText
                    value={safeText(props.overlayButtonText)}
                    onCommit={(value) =>
                      onUpdateBlock(index, { overlayButtonText: value })
                    }
                    className="text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "contact-and-services") {
      const backgroundColor = safeText(props.backgroundColor);
      const bg = backgroundColor.toLowerCase();
      const isLight =
        !bg || bg === "#fff" || bg === "#ffffff" || bg === "white";
      const headingClass = isLight ? "text-slate-900" : "text-white";
      const bodyClass = isLight ? "text-slate-600" : "text-slate-200";
      const secondaryCtaClass = isLight
        ? "border-slate-300 text-slate-700"
        : "border-white/40 text-white";
      return wrap(
        <section
          className={`py-10 ${isLight ? "text-slate-900" : "text-white"}`}
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6">
            <div className="text-center">
              <h2 className={`text-3xl font-semibold leading-tight ${headingClass}`}>
                <EditableText
                  value={safeText(props.heading)}
                  onCommit={(value) => onUpdateBlock(index, { heading: value })}
                  className={headingClass}
                  multiline
                />
              </h2>
              <p className={`mt-3 text-base ${bodyClass}`}>
                <EditableText
                  value={safeText(props.subheading)}
                  onCommit={(value) =>
                    onUpdateBlock(index, { subheading: value })
                  }
                  className={bodyClass}
                />
              </p>
              <p className={`mt-2 text-sm ${bodyClass}`}>
                <EditableText
                  value={safeText(props.badges)}
                  onCommit={(value) => onUpdateBlock(index, { badges: value })}
                  className={bodyClass}
                  multiline
                />
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <span className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white">
                <EditableText
                  value={safeText(props.primaryCtaText)}
                  onCommit={(value) =>
                    onUpdateBlock(index, { primaryCtaText: value })
                  }
                  className="text-white"
                />
              </span>
              <span className={`rounded-full border px-6 py-3 text-sm font-semibold ${secondaryCtaClass}`}>
                <EditableText
                  value={safeText(props.secondaryCtaText)}
                  onCommit={(value) =>
                    onUpdateBlock(index, { secondaryCtaText: value })
                  }
                  className={isLight ? "text-slate-700" : "text-white"}
                />
              </span>
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "about-us-text") {
      const backgroundColor = safeText(props.backgroundColor) || "#0b3c86";
      const bg = backgroundColor.toLowerCase();
      const isLight =
        !bg || bg === "#fff" || bg === "#ffffff" || bg === "white";
      const headingClass = isLight ? "text-slate-900" : "text-white";
      const subheadingClass = isLight ? "text-slate-600" : "text-slate-200";
      const descriptionClass = isLight ? "text-slate-700" : "text-slate-100";
      const taglineClass = isLight ? "text-slate-500" : "text-slate-200";
      return wrap(
        <section
          className={`py-16 ${isLight ? "text-slate-900" : "text-white"}`}
          style={{ backgroundColor }}
        >
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 text-center">
            <h2 className={`text-4xl font-semibold tracking-wide whitespace-pre-line ${headingClass}`}>
              <EditableText
                value={safeText(props.heading)}
                onCommit={(value) => onUpdateBlock(index, { heading: value })}
                className={headingClass}
              />
            </h2>
            <p className={`text-base font-medium whitespace-pre-line ${subheadingClass}`}>
              <EditableText
                value={safeText(props.subheading)}
                onCommit={(value) =>
                  onUpdateBlock(index, { subheading: value })
                }
                className={subheadingClass}
              />
            </p>
            <p className={`text-sm whitespace-pre-line ${descriptionClass}`}>
              <EditableText
                value={safeText(props.description)}
                onCommit={(value) =>
                  onUpdateBlock(index, { description: value })
                }
                className={descriptionClass}
                multiline
              />
            </p>
            <p className={`text-sm font-semibold whitespace-pre-line ${taglineClass}`}>
              <EditableText
                value={safeText(props.tagline)}
                onCommit={(value) => onUpdateBlock(index, { tagline: value })}
                className={taglineClass}
              />
            </p>
          </div>
        </section>
      );
    }

    if (block.type === "about-us-images") {
      const backgroundColor = safeText(props.backgroundColor) || "#ffe800";
      const image = resolvePreviewImage(props.image);
      return wrap(
        <section className="py-16" style={{ backgroundColor }}>
          <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
                <EditableText
                  value={safeText(props.heading)}
                  onCommit={(value) => onUpdateBlock(index, { heading: value })}
                  className="text-[var(--brand-navy)]"
                />
              </h2>
              <p className="text-sm text-slate-800 whitespace-pre-line">
                <EditableText
                  value={safeText(props.description)}
                  onCommit={(value) =>
                    onUpdateBlock(index, { description: value })
                  }
                  className="text-slate-800"
                  multiline
                />
              </p>
            </div>
            <div className="overflow-hidden rounded-3xl bg-white/70 shadow-xl shadow-slate-900/10">
              {image ? (
                <img
                  src={image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                  Upload image
                </div>
              )}
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "branches-detail") {
      const backgroundColor = safeText(props.backgroundColor) || "#ffe800";
      const branches = (props.branches || []) as Array<Record<string, any>>;
      const updateBranch = (itemIndex: number, patch: Record<string, unknown>) =>
        updateItem("branches", itemIndex, patch);
      const branch = branches[0];
      return wrap(
        <section className="py-16" style={{ backgroundColor }}>
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6">
            <h2 className="text-center text-3xl font-semibold text-[var(--brand-navy)]">
              <EditableText
                value={safeText(props.heading)}
                onCommit={(value) => onUpdateBlock(index, { heading: value })}
                className="text-[var(--brand-navy)]"
              />
            </h2>
            <div className="grid gap-6 md:grid-cols-[0.45fr_0.55fr]">
              <div className="rounded-2xl bg-white p-5 shadow-lg shadow-blue-900/10">
                {branch ? (
                  <>
                    <h3 className="text-base font-semibold text-[var(--brand-navy)]">
                      <EditableText
                        value={safeText(branch.name)}
                        onCommit={(value) => updateBranch(0, { name: value })}
                        className="text-[var(--brand-navy)]"
                      />
                    </h3>
                    <div className="mt-4 grid gap-3 text-xs text-slate-600">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                          📍
                        </span>
                        <div>
                          <p className="font-semibold text-slate-700">ที่อยู่</p>
                          <p className="whitespace-pre-line">
                            <EditableText
                              value={safeText(branch.address)}
                              onCommit={(value) =>
                                updateBranch(0, { address: value })
                              }
                              className="text-slate-600"
                              multiline
                            />
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                          ☎️
                        </span>
                        <div>
                          <p className="font-semibold text-slate-700">โทรศัพท์</p>
                          <p>
                            <EditableText
                              value={safeText(branch.phone)}
                              onCommit={(value) =>
                                updateBranch(0, { phone: value })
                              }
                              className="text-slate-600"
                            />
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                          ✉️
                        </span>
                        <div>
                          <p className="font-semibold text-slate-700">อีเมล</p>
                          <p>
                            <EditableText
                              value={safeText(branch.email)}
                              onCommit={(value) =>
                                updateBranch(0, { email: value })
                              }
                              className="text-slate-600"
                            />
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                          🕒
                        </span>
                        <div>
                          <p className="font-semibold text-slate-700">เวลาทำการ</p>
                          <p className="whitespace-pre-line">
                            <EditableText
                              value={safeText(branch.hours)}
                              onCommit={(value) =>
                                updateBranch(0, { hours: value })
                              }
                              className="text-slate-600"
                              multiline
                            />
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-slate-700">
                        บริการที่สาขานี้
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(branch.services || []).map(
                          (service: string, serviceIndex: number) => (
                            <span
                              key={`${service}-${serviceIndex}`}
                              className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-600"
                            >
                              <EditableText
                                value={safeText(service)}
                                onCommit={(value) => {
                                  const next = [...(branch.services || [])];
                                  next[serviceIndex] = value;
                                  updateBranch(0, { services: next });
                                }}
                                className="text-slate-600"
                              />
                            </span>
                          )
                        )}
                      </div>
                    </div>
                    <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">
                      📍
                      <EditableText
                        value={safeText(branch.mapLabel) || "นำทางไปสาขานี้"}
                        onCommit={(value) =>
                          updateBranch(0, { mapLabel: value })
                        }
                        className="text-white"
                      />
                    </button>
                  </>
                ) : (
                  <div className="text-sm text-slate-500">
                    Add at least one branch to show details.
                  </div>
                )}
              </div>
              <div className="overflow-hidden rounded-2xl bg-white shadow-lg shadow-blue-900/10">
                {branch?.mapHref && isEmbeddableMapUrl(branch.mapHref) ? (
                  <iframe
                    title="Branch map"
                    src={safeText(branch.mapHref)}
                    className="h-[420px] w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="flex h-[420px] flex-col items-center justify-center gap-3 text-center text-sm text-slate-400">
                    <span>Map URL must be a Google Maps embed link.</span>
                    {branch?.mapHref ? (
                      <a
                        href={safeText(branch.mapHref)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                      >
                        Open in maps
                      </a>
                    ) : (
                      <span>Add mapHref to show the map.</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "google-map") {
      const backgroundColor = safeText(props.backgroundColor) || "#ffffff";
      const mapSrc = extractMapEmbedSrc(props.mapUrl);
      const embedSrc = mapSrc && isEmbeddableMapUrl(mapSrc) ? mapSrc : "";
      const height = Math.max(240, Number(props.height) || 420);
      return wrap(
        <section className="py-16" style={{ backgroundColor }}>
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6">
            <h2 className="text-center text-3xl font-semibold text-[var(--brand-navy)]">
              <EditableText
                value={safeText(props.heading)}
                onCommit={(value) => onUpdateBlock(index, { heading: value })}
                className="text-[var(--brand-navy)]"
              />
            </h2>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-blue-900/10">
              {embedSrc ? (
                <iframe
                  title="Google Map"
                  src={embedSrc}
                  className="w-full"
                  style={{ height }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              ) : (
                <div
                  className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-slate-400"
                  style={{ height }}
                >
                  <span>Paste a Google Maps embed URL or iframe.</span>
                  {mapSrc ? (
                    <a
                      href={mapSrc}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                    >
                      Open map link
                    </a>
                  ) : (
                    <span>No map URL yet.</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "our-vision") {
      const backgroundColor = safeText(props.backgroundColor) || "#fff78a";
      const cards = (props.cards || []) as Array<Record<string, any>>;
      const updateCard = (itemIndex: number, patch: Record<string, unknown>) =>
        updateItem("cards", itemIndex, patch);
      return wrap(
        <section className="py-16" style={{ backgroundColor }}>
          <div className="mx-auto grid max-w-5xl gap-6 px-6 md:grid-cols-2">
            {cards.map((card, cardIndex) => (
              <div
                key={card.id || `${card.title}-${cardIndex}`}
                className="rounded-2xl bg-white p-6 shadow-xl shadow-blue-900/10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-blue)] text-white">
                  {card.icon ? (
                    <img
                      src={resolvePreviewImage(card.icon)}
                      alt=""
                      className="h-6 w-6 object-contain brightness-0 invert"
                    />
                  ) : (
                    <span className="text-sm">★</span>
                  )}
                </div>
                <h3 className="mt-4 text-base font-semibold text-[var(--brand-navy)]">
                  <EditableText
                    value={safeText(card.title)}
                    onCommit={(value) =>
                      updateCard(cardIndex, { title: value })
                    }
                    className="text-[var(--brand-navy)]"
                  />
                </h3>
                <p className="text-xs text-[var(--brand-blue)]">
                  <EditableText
                    value={safeText(card.subtitle)}
                    onCommit={(value) =>
                      updateCard(cardIndex, { subtitle: value })
                    }
                    className="text-[var(--brand-blue)]"
                  />
                </p>
                <p className="mt-3 text-xs text-slate-600 whitespace-pre-line">
                  <EditableText
                    value={safeText(card.description)}
                    onCommit={(value) =>
                      updateCard(cardIndex, { description: value })
                    }
                    className="text-slate-600"
                    multiline
                  />
                </p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (block.type === "our-core-values") {
      const backgroundColor = safeText(props.backgroundColor) || "#ffe800";
      const items = (props.items || []) as Array<Record<string, any>>;
      const updateValue = (itemIndex: number, patch: Record<string, unknown>) =>
        updateItem("items", itemIndex, patch);
      return wrap(
        <section className="py-16" style={{ backgroundColor }}>
          <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 text-center">
            <div>
              <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
                <EditableText
                  value={safeText(props.heading)}
                  onCommit={(value) => onUpdateBlock(index, { heading: value })}
                  className="text-[var(--brand-navy)]"
                />
              </h2>
              <p className="mt-2 text-sm text-[var(--brand-blue)]">
                <EditableText
                  value={safeText(props.subheading)}
                  onCommit={(value) =>
                    onUpdateBlock(index, { subheading: value })
                  }
                  className="text-[var(--brand-blue)]"
                />
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {items.map((item, itemIndex) => (
                <div key={item.id || `${item.title}-${itemIndex}`}>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-blue)] text-white">
                    {item.icon ? (
                      <img
                        src={resolvePreviewImage(item.icon)}
                        alt=""
                        className="h-6 w-6 object-contain brightness-0 invert"
                      />
                    ) : (
                      <span className="text-sm">★</span>
                    )}
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-[var(--brand-navy)]">
                    <EditableText
                      value={safeText(item.title)}
                      onCommit={(value) =>
                        updateValue(itemIndex, { title: value })
                      }
                      className="text-[var(--brand-navy)]"
                    />
                  </h3>
                  <p className="text-xs text-[var(--brand-blue)]">
                    <EditableText
                      value={safeText(item.subtitle)}
                      onCommit={(value) =>
                        updateValue(itemIndex, { subtitle: value })
                      }
                      className="text-[var(--brand-blue)]"
                    />
                  </p>
                  <p className="mt-2 text-xs text-slate-600 whitespace-pre-line">
                    <EditableText
                      value={safeText(item.description)}
                      onCommit={(value) =>
                        updateValue(itemIndex, { description: value })
                      }
                      className="text-slate-600"
                      multiline
                    />
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "why-choose-us-v2") {
      const backgroundColor = safeText(props.backgroundColor) || "#fff78a";
      const items = (props.items || []) as Array<Record<string, any>>;
      const updateValue = (itemIndex: number, patch: Record<string, unknown>) =>
        updateItem("items", itemIndex, patch);
      return wrap(
        <section className="py-16" style={{ backgroundColor }}>
          <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 text-center">
            <div>
              <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
                <EditableText
                  value={safeText(props.heading)}
                  onCommit={(value) => onUpdateBlock(index, { heading: value })}
                  className="text-[var(--brand-navy)]"
                />
              </h2>
              <p className="mt-2 text-sm text-[var(--brand-blue)]">
                <EditableText
                  value={safeText(props.subheading)}
                  onCommit={(value) =>
                    onUpdateBlock(index, { subheading: value })
                  }
                  className="text-[var(--brand-blue)]"
                />
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((item, itemIndex) => (
                <div
                  key={item.id || `${item.text}-${itemIndex}`}
                  className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-left shadow-lg shadow-blue-900/10"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-blue)] text-xs font-semibold text-white">
                    ✓
                  </span>
                  <p className="text-sm text-slate-700">
                    <EditableText
                      value={safeText(item.text)}
                      onCommit={(value) =>
                        updateValue(itemIndex, { text: value })
                      }
                      className="text-slate-700"
                    />
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "work-with-us") {
      const backgroundColor = safeText(props.backgroundColor) || "#0b3c86";
      const icon = resolvePreviewImage(props.icon);
      return wrap(
        <section className="py-14 text-white" style={{ backgroundColor }}>
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-6 text-center">
            {icon ? (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/30 bg-white/10">
                <img
                  src={icon}
                  alt=""
                  className="h-7 w-7 object-contain brightness-0 invert"
                />
              </div>
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/30 bg-white/10 text-xl">
                ✦
              </div>
            )}
            <h2 className="text-3xl font-semibold text-white">
              <EditableText
                value={safeText(props.heading)}
                onCommit={(value) => onUpdateBlock(index, { heading: value })}
                className="text-white"
              />
            </h2>
            <p className="text-sm text-slate-200 whitespace-pre-line">
              <EditableText
                value={safeText(props.subheading)}
                onCommit={(value) =>
                  onUpdateBlock(index, { subheading: value })
                }
                className="text-slate-200"
                multiline
              />
            </p>
          </div>
        </section>
      );
    }

    if (block.type === "welfare-and-benefits") {
      const backgroundColor = safeText(props.backgroundColor) || "#fff78a";
      const items = (props.items || []) as Array<Record<string, any>>;
      const updateValue = (itemIndex: number, patch: Record<string, unknown>) =>
        updateItem("items", itemIndex, patch);
      return wrap(
        <section className="py-16" style={{ backgroundColor }}>
          <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 text-center">
            <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
              <EditableText
                value={safeText(props.heading)}
                onCommit={(value) => onUpdateBlock(index, { heading: value })}
                className="text-[var(--brand-navy)]"
              />
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {items.map((item, itemIndex) => (
                <div
                  key={item.id || `${item.title}-${itemIndex}`}
                  className="rounded-2xl bg-white px-6 py-8 shadow-xl shadow-blue-900/10"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-blue)] text-white">
                    {item.icon ? (
                      <img
                        src={resolvePreviewImage(item.icon)}
                        alt=""
                        className="h-6 w-6 object-contain brightness-0 invert"
                      />
                    ) : (
                      <span className="text-sm">★</span>
                    )}
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-[var(--brand-navy)]">
                    <EditableText
                      value={safeText(item.title)}
                      onCommit={(value) =>
                        updateValue(itemIndex, { title: value })
                      }
                      className="text-[var(--brand-navy)]"
                    />
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 whitespace-pre-line">
                    <EditableText
                      value={safeText(item.description)}
                      onCommit={(value) =>
                        updateValue(itemIndex, { description: value })
                      }
                      className="text-slate-600"
                      multiline
                    />
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "job-vacancies") {
      const backgroundColor = safeText(props.backgroundColor) || "#ffe800";
      const jobs = (props.jobs || []) as Array<Record<string, any>>;
      const updateJob = (jobIndex: number, patch: Record<string, unknown>) =>
        updateItem("jobs", jobIndex, patch);
      return wrap(
        <section className="py-16" style={{ backgroundColor }}>
          <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6">
            <h2 className="text-center text-2xl font-semibold text-[var(--brand-navy)]">
              <EditableText
                value={safeText(props.heading)}
                onCommit={(value) => onUpdateBlock(index, { heading: value })}
                className="text-[var(--brand-navy)]"
              />
            </h2>
            <div className="grid gap-6">
              {jobs.map((job, jobIndex) => (
                <div
                  key={job.id || `${job.title}-${jobIndex}`}
                  className="rounded-2xl bg-white p-6 shadow-xl shadow-blue-900/10"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--brand-navy)]">
                        <EditableText
                          value={safeText(job.title)}
                          onCommit={(value) =>
                            updateJob(jobIndex, { title: value })
                          }
                          className="text-[var(--brand-navy)]"
                        />
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          📍
                          <EditableText
                            value={safeText(job.location)}
                            onCommit={(value) =>
                              updateJob(jobIndex, { location: value })
                            }
                            className="text-slate-500"
                          />
                        </span>
                        <span className="flex items-center gap-1">
                          🕒
                          <EditableText
                            value={safeText(job.type)}
                            onCommit={(value) =>
                              updateJob(jobIndex, { type: value })
                            }
                            className="text-slate-500"
                          />
                        </span>
                        <span className="rounded-full bg-[var(--brand-yellow)] px-3 py-1 text-[11px] font-semibold text-[var(--brand-navy)]">
                          <EditableText
                            value={safeText(job.salary)}
                            onCommit={(value) =>
                              updateJob(jobIndex, { salary: value })
                            }
                            className="text-[var(--brand-navy)]"
                          />
                        </span>
                      </div>
                    </div>
                    <button className="rounded-full bg-[var(--brand-blue)] px-4 py-2 text-xs font-semibold text-white">
                      <EditableText
                        value={safeText(job.applyLabel) || "Apply for a job"}
                        onCommit={(value) =>
                          updateJob(jobIndex, { applyLabel: value })
                        }
                        className="text-white"
                      />
                    </button>
                  </div>
                  <div className="mt-4 text-xs text-slate-600">
                    <p className="font-semibold text-slate-700">Features:</p>
                    <ul className="mt-2 grid gap-1">
                      {(job.features || []).map(
                        (feature: string, featureIndex: number) => (
                          <li key={`${feature}-${featureIndex}`} className="flex gap-2">
                            <span className="mt-0.5 text-[10px] text-blue-600">•</span>
                            <EditableText
                              value={safeText(feature)}
                              onCommit={(value) => {
                                const next = [...(job.features || [])];
                                next[featureIndex] = value;
                                updateJob(jobIndex, { features: next });
                              }}
                              className="text-slate-600"
                            />
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "request-quotation-forms") {
      const backgroundColor = safeText(props.backgroundColor) || "#ffe800";
      const services = (props.services || []) as string[];
      return wrap(
        <section className="py-16" style={{ backgroundColor }}>
          <div className="mx-auto grid max-w-4xl gap-8 px-6">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
                <EditableText
                  value={safeText(props.heading)}
                  onCommit={(value) => onUpdateBlock(index, { heading: value })}
                  className="text-[var(--brand-navy)]"
                />
              </h2>
              <p className="mt-2 text-sm text-[var(--brand-blue)]">
                <EditableText
                  value={safeText(props.subheading)}
                  onCommit={(value) =>
                    onUpdateBlock(index, { subheading: value })
                  }
                  className="text-[var(--brand-blue)]"
                />
              </p>
            </div>
            <div className="grid gap-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-blue-900/10 backdrop-blur">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-xs text-slate-700">
                  <span className="font-semibold">
                    {safeText(props.nameLabel)}
                  </span>
                  <input
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-sm"
                    placeholder={safeText(props.nameLabel)}
                  />
                </label>
                <label className="grid gap-2 text-xs text-slate-700">
                  <span className="font-semibold">
                    {safeText(props.companyLabel)}
                  </span>
                  <input
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-sm"
                    placeholder={safeText(props.companyLabel)}
                  />
                </label>
                <label className="grid gap-2 text-xs text-slate-700">
                  <span className="font-semibold">
                    {safeText(props.emailLabel)}
                  </span>
                  <input
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-sm"
                    placeholder={safeText(props.emailLabel)}
                  />
                </label>
                <label className="grid gap-2 text-xs text-slate-700">
                  <span className="font-semibold">
                    {safeText(props.phoneLabel)}
                  </span>
                  <input
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-sm"
                    placeholder={safeText(props.phoneLabel)}
                  />
                </label>
              </div>
              <label className="grid gap-2 text-xs text-slate-700">
                <span className="font-semibold">
                  {safeText(props.serviceLabel)}
                </span>
                <select className="rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-sm">
                  <option>{safeText(props.serviceLabel)}</option>
                  {services.map((service) => (
                    <option key={service}>{service}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-xs text-slate-700">
                <span className="font-semibold">
                  {safeText(props.detailsLabel)}
                </span>
                <textarea
                  className="min-h-[120px] rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-sm"
                  placeholder={safeText(props.detailsLabel)}
                />
              </label>
              <button className="rounded-2xl bg-[var(--brand-blue)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/20">
                <EditableText
                  value={safeText(props.submitLabel)}
                  onCommit={(value) =>
                    onUpdateBlock(index, { submitLabel: value })
                  }
                  className="text-white"
                />
              </button>
              <p className="text-center text-xs text-slate-600">
                <EditableText
                  value={safeText(props.submitNote)}
                  onCommit={(value) =>
                    onUpdateBlock(index, { submitNote: value })
                  }
                  className="text-slate-600"
                />
              </p>
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "contact-channels") {
      const backgroundColor = safeText(props.backgroundColor) || "#ffe800";
      const channels = (props.channels || []) as Array<Record<string, any>>;
      const ctaButtons = (props.ctaButtons || []) as Array<Record<string, any>>;
      const updateChannel = (itemIndex: number, patch: Record<string, unknown>) =>
        updateItem("channels", itemIndex, patch);
      const updateCta = (itemIndex: number, patch: Record<string, unknown>) =>
        updateItem("ctaButtons", itemIndex, patch);
      return wrap(
        <section className="py-16" style={{ backgroundColor }}>
          <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6">
            <div className="text-left">
              <h2 className="text-2xl font-semibold text-[var(--brand-navy)]">
                <EditableText
                  value={safeText(props.heading)}
                  onCommit={(value) => onUpdateBlock(index, { heading: value })}
                  className="text-[var(--brand-navy)]"
                />
              </h2>
              <p className="mt-2 text-sm text-[var(--brand-blue)]">
                <EditableText
                  value={safeText(props.subheading)}
                  onCommit={(value) =>
                    onUpdateBlock(index, { subheading: value })
                  }
                  className="text-[var(--brand-blue)]"
                />
              </p>
            </div>
            <div className="grid gap-4">
              {channels.map((channel, channelIndex) => (
                <div
                  key={channel.id || `${channel.title}-${channelIndex}`}
                  className="flex gap-4 rounded-2xl bg-white p-5 shadow-lg shadow-blue-900/10"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-blue)] text-white">
                    {channel.icon ? (
                      <img
                        src={resolvePreviewImage(channel.icon)}
                        alt=""
                        className="h-6 w-6 object-contain brightness-0 invert"
                      />
                    ) : (
                      <span className="text-sm">★</span>
                    )}
                  </div>
                  <div className="flex-1 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">
                        <EditableText
                          value={safeText(channel.title)}
                          onCommit={(value) =>
                            updateChannel(channelIndex, { title: value })
                          }
                          className="text-slate-800"
                        />
                      </p>
                      <span className="text-[11px] text-slate-400">
                        <EditableText
                          value={safeText(channel.subtitle)}
                          onCommit={(value) =>
                            updateChannel(channelIndex, { subtitle: value })
                          }
                          className="text-slate-400"
                        />
                      </span>
                    </div>
                    <p className="mt-2 font-semibold text-[var(--brand-navy)]">
                      <EditableText
                        value={safeText(channel.primary)}
                        onCommit={(value) =>
                          updateChannel(channelIndex, { primary: value })
                        }
                        className="text-[var(--brand-navy)]"
                      />
                    </p>
                    {channel.secondary && (
                      <p className="mt-1 text-[var(--brand-navy)]">
                        <EditableText
                          value={safeText(channel.secondary)}
                          onCommit={(value) =>
                            updateChannel(channelIndex, { secondary: value })
                          }
                          className="text-[var(--brand-navy)]"
                        />
                      </p>
                    )}
                    {channel.note && (
                      <p className="mt-1 text-[11px] text-slate-500">
                        <EditableText
                          value={safeText(channel.note)}
                          onCommit={(value) =>
                            updateChannel(channelIndex, { note: value })
                          }
                          className="text-slate-500"
                        />
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-[var(--brand-blue)] p-5 text-white">
              <h3 className="text-sm font-semibold">
                <EditableText
                  value={safeText(props.ctaTitle)}
                  onCommit={(value) => onUpdateBlock(index, { ctaTitle: value })}
                  className="text-white"
                />
              </h3>
              <p className="mt-2 text-xs text-slate-200">
                <EditableText
                  value={safeText(props.ctaSubtitle)}
                  onCommit={(value) =>
                    onUpdateBlock(index, { ctaSubtitle: value })
                  }
                  className="text-slate-200"
                />
              </p>
              <div className="mt-4 grid gap-2">
                {ctaButtons.map((cta, ctaIndex) => (
                  <button
                    key={cta.id || `${cta.label}-${ctaIndex}`}
                    className="flex items-center justify-center gap-2 rounded-full bg-[var(--brand-yellow)] px-4 py-2 text-xs font-semibold text-[var(--brand-navy)]"
                  >
                    {cta.icon ? (
                      <img
                        src={resolvePreviewImage(cta.icon)}
                        alt=""
                        className="h-4 w-4 object-contain"
                      />
                    ) : (
                      <span>☎️</span>
                    )}
                    <EditableText
                      value={safeText(cta.label)}
                      onCommit={(value) =>
                        updateCta(ctaIndex, { label: value })
                      }
                      className="text-[var(--brand-navy)]"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "contact-info-card") {
      const backgroundColor = safeText(props.backgroundColor) || "#ffffff";
      const items = (props.items || []) as Array<Record<string, any>>;
      const socials = (props.socials || []) as Array<Record<string, any>>;
      const mapSrc = extractMapEmbedSrc(props.mapUrl);
      const embedSrc = mapSrc && isEmbeddableMapUrl(mapSrc) ? mapSrc : "";
      const mapHeight = Math.max(240, Number(props.mapHeight) || 420);
      const updateInfo = (itemIndex: number, patch: Record<string, unknown>) =>
        updateItem("items", itemIndex, patch);
      const updateSocial = (itemIndex: number, patch: Record<string, unknown>) =>
        updateItem("socials", itemIndex, patch);
      return wrap(
        <section className="py-16" style={{ backgroundColor }}>
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-8 lg:grid-cols-[0.58fr_0.42fr]">
              <div className="rounded-[32px] bg-white p-8 shadow-2xl shadow-slate-900/10">
                <h2 className="text-2xl font-semibold text-slate-900">
                  <EditableText
                    value={safeText(props.heading)}
                    onCommit={(value) =>
                      onUpdateBlock(index, { heading: value })
                    }
                    className="text-slate-900"
                  />
                </h2>
                <div className="mt-6 grid gap-4">
                  {items.map((item, itemIndex) => {
                    const icon = safeText(item.icon);
                    const iconIsImage = icon && isProbablyImage(icon);
                    const value = safeText(item.value);
                    const href = safeText(item.href);
                    return (
                      <div
                        key={item.id || `${item.title}-${itemIndex}`}
                        className="flex gap-4"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                          {icon ? (
                            iconIsImage ? (
                              <img
                                src={resolvePreviewImage(icon)}
                                alt=""
                                className="h-5 w-5 object-contain"
                              />
                            ) : (
                              <span className="text-lg">{icon}</span>
                            )
                          ) : (
                            <span className="text-lg">•</span>
                          )}
                        </div>
                        <div className="flex-1 text-sm text-slate-600">
                          <p className="font-semibold text-slate-900">
                            <EditableText
                              value={safeText(item.title)}
                              onCommit={(value) =>
                                updateInfo(itemIndex, { title: value })
                              }
                              className="text-slate-900"
                            />
                          </p>
                          {href ? (
                            <a
                              href={href}
                              className="text-slate-800 underline-offset-2 hover:underline whitespace-pre-line"
                            >
                              <EditableText
                                value={value}
                                onCommit={(next) =>
                                  updateInfo(itemIndex, { value: next })
                                }
                                className="text-slate-800 whitespace-pre-line"
                              />
                            </a>
                          ) : (
                            <p className="text-slate-800 whitespace-pre-line">
                              <EditableText
                                value={value}
                                onCommit={(next) =>
                                  updateInfo(itemIndex, { value: next })
                                }
                                className="text-slate-800 whitespace-pre-line"
                              />
                            </p>
                          )}
                          {safeText(item.note) ? (
                            <p className="mt-1 text-xs text-slate-500">
                              <EditableText
                                value={safeText(item.note)}
                                onCommit={(next) =>
                                  updateInfo(itemIndex, { note: next })
                                }
                                className="text-slate-500"
                              />
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="text-xs font-semibold text-slate-500">
                    <EditableText
                      value={safeText(props.socialLabel)}
                      onCommit={(value) =>
                        onUpdateBlock(index, { socialLabel: value })
                      }
                      className="text-slate-500"
                    />
                  </span>
                  {socials.map((social, socialIndex) => {
                    const icon = safeText(social.icon);
                    const iconIsImage = icon && isProbablyImage(icon);
                    const href = safeText(social.href) || "#";
                    return (
                      <a
                        key={social.id || `${social.label}-${socialIndex}`}
                        href={href}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600"
                      >
                        {icon ? (
                          iconIsImage ? (
                            <img
                              src={resolvePreviewImage(icon)}
                              alt={safeText(social.label)}
                              className="h-4 w-4 object-contain"
                            />
                          ) : (
                            <span className="text-sm">{icon}</span>
                          )
                        ) : (
                          <span className="text-sm">★</span>
                        )}
                        <span className="sr-only">
                          <EditableText
                            value={safeText(social.label)}
                            onCommit={(value) =>
                              updateSocial(socialIndex, { label: value })
                            }
                          />
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
              <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                {embedSrc ? (
                  <iframe
                    title="Contact map"
                    src={embedSrc}
                    className="w-full"
                    style={{ height: mapHeight }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                ) : (
                  <div
                    className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-slate-400"
                    style={{ height: mapHeight }}
                  >
                    <span>Map URL must be a Google Maps embed link.</span>
                    {mapSrc ? (
                      <a
                        href={mapSrc}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                      >
                        Open in maps
                      </a>
                    ) : (
                      <span>Add mapUrl to show the map.</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "contact-us-text") {
      const baseColor = safeText(props.backgroundColor) || "#0b3c86";
      const gradientColor = safeText(props.gradientColor) || "#f7c326";
      const backgroundStyle = {
        background: `linear-gradient(90deg, ${baseColor} 0%, ${gradientColor} 100%)`,
      };
      return wrap(
        <section className="py-16 text-white" style={backgroundStyle}>
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-6 text-center">
            <h2 className="text-4xl font-semibold text-white">
              <EditableText
                value={safeText(props.heading)}
                onCommit={(value) => onUpdateBlock(index, { heading: value })}
                className="text-white"
              />
            </h2>
            <p className="text-base text-slate-100">
              <EditableText
                value={safeText(props.subheading)}
                onCommit={(value) =>
                  onUpdateBlock(index, { subheading: value })
                }
                className="text-slate-100"
              />
            </p>
            <p className="text-sm text-slate-100 whitespace-pre-line">
              <EditableText
                value={safeText(props.description)}
                onCommit={(value) =>
                  onUpdateBlock(index, { description: value })
                }
                className="text-slate-100"
                multiline
              />
            </p>
          </div>
        </section>
      );
    }

    if (block.type === "achievement-expreience") {
      const items = (props.items || []) as Array<Record<string, string>>;
      const backgroundColor = safeText(props.backgroundColor);
      return wrap(
        <section
          className="py-10 text-white"
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-4">
            {items.map((item, itemIndex) => (
              <AchievementMetric
                key={`${item.value}-${itemIndex}`}
                item={item}
                onChange={(patch) => updateItem("items", itemIndex, patch)}
              />
            ))}
          </div>
        </section>
      );
    }

    if (block.type === "why-choose-us") {
      const items = (props.items || []) as Array<Record<string, string>>;
      const backgroundColor = safeText(props.backgroundColor);
      const cardBackgroundColor = safeText(props.cardBackgroundColor);
      return wrap(
        <section
          className="py-12"
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
                <EditableText
                  value={safeText(props.heading)}
                  onCommit={(value) => onUpdateBlock(index, { heading: value })}
                  className="text-[var(--brand-navy)]"
                />
              </h2>
              <p className="mt-2 text-sm text-[var(--brand-blue)]">
                <EditableText
                  value={safeText(props.subheading)}
                  onCommit={(value) =>
                    onUpdateBlock(index, { subheading: value })
                  }
                  className="text-[var(--brand-blue)]"
                />
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-4">
              {items.map((item, itemIndex) => (
                <div
                  key={`${item.title}-${itemIndex}`}
                  className="rounded-3xl p-6 shadow-xl shadow-blue-900/10"
                  style={
                    cardBackgroundColor
                      ? { backgroundColor: cardBackgroundColor }
                      : undefined
                  }
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-blue)] text-white">
                    {item.icon ? (
                      <img
                        src={resolvePreviewImage(item.icon)}
                        alt=""
                        className="h-6 w-6 object-contain brightness-0 invert"
                      />
                    ) : (
                      <span className="text-sm">★</span>
                    )}
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-[var(--brand-navy)]">
                    <EditableText
                      value={safeText(item.title)}
                      onCommit={(value) =>
                        updateItem("items", itemIndex, { title: value })
                      }
                      className="text-[var(--brand-navy)]"
                    />
                  </h3>
                  <p className="text-sm text-[var(--brand-blue)]">
                    <EditableText
                      value={safeText(item.subtitle)}
                      onCommit={(value) =>
                        updateItem("items", itemIndex, { subtitle: value })
                      }
                      className="text-[var(--brand-blue)]"
                    />
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    <EditableText
                      value={safeText(item.description)}
                      onCommit={(value) =>
                        updateItem("items", itemIndex, { description: value })
                      }
                      className="text-slate-600"
                      multiline
                    />
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "our-core-services") {
      const items = (props.items || []) as Array<Record<string, string>>;
      const backgroundColor = safeText(props.backgroundColor);
      const cardBackgroundColor = safeText(props.cardBackgroundColor);
      const ctaBackgroundColor = safeText(props.ctaBackgroundColor);
      const ctaTextColor = safeText(props.ctaTextColor);
      const imageHeight = Number(props.imageHeight) || 176;
      const cardMinHeight = Number(props.cardMinHeight) || 0;
      return wrap(
        <section
          className="py-12"
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
                <EditableText
                  value={safeText(props.heading)}
                  onCommit={(value) => onUpdateBlock(index, { heading: value })}
                  className="text-[var(--brand-navy)]"
                />
              </h2>
              <p className="mt-2 text-sm text-[var(--brand-blue)]">
                <EditableText
                  value={safeText(props.subheading)}
                  onCommit={(value) =>
                    onUpdateBlock(index, { subheading: value })
                  }
                  className="text-[var(--brand-blue)]"
                />
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-4">
              {items.map((item, itemIndex) => (
                <div
                  key={`${item.title}-${itemIndex}`}
                  className="overflow-hidden rounded-3xl shadow-xl shadow-blue-900/10"
                  style={
                    cardBackgroundColor
                      ? {
                        backgroundColor: cardBackgroundColor,
                        minHeight: cardMinHeight || undefined,
                      }
                      : undefined
                  }
                >
                  <div
                    className="w-full bg-slate-100"
                    style={{ height: imageHeight }}
                  >
                    {item.image && (
                      <img
                        src={resolvePreviewImage(item.image)}
                        alt={safeText(item.title)}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="grid gap-3 p-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-blue)] text-white">
                      {item.icon ? (
                        <img
                          src={resolvePreviewImage(item.icon)}
                          alt=""
                          className="h-5 w-5 object-contain brightness-0 invert"
                        />
                      ) : (
                        <span className="text-xs">★</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[var(--brand-navy)]">
                        <EditableText
                          value={safeText(item.title)}
                          onCommit={(value) =>
                            updateItem("items", itemIndex, { title: value })
                          }
                          className="text-[var(--brand-navy)]"
                        />
                      </h3>
                      <p className="text-sm text-[var(--brand-blue)]">
                        <EditableText
                          value={safeText(item.subtitle)}
                          onCommit={(value) =>
                            updateItem("items", itemIndex, { subtitle: value })
                          }
                          className="text-[var(--brand-blue)]"
                        />
                      </p>
                    </div>
                    <p className="text-sm text-slate-600">
                      <EditableText
                        value={safeText(item.description)}
                        onCommit={(value) =>
                          updateItem("items", itemIndex, {
                            description: value,
                          })
                        }
                        className="text-slate-600"
                        multiline
                      />
                    </p>
                    <button
                      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold shadow-sm"
                      style={{
                        backgroundColor:
                          ctaBackgroundColor || "var(--brand-yellow)",
                        color: ctaTextColor || "var(--brand-navy)",
                      }}
                    >
                      <EditableText
                        value={safeText(item.ctaText) || "เรียนรู้เพิ่มเติม"}
                        onCommit={(value) =>
                          updateItem("items", itemIndex, { ctaText: value })
                        }
                        className="text-[var(--brand-navy)]"
                      />
                      <span>→</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "service-process") {
      const items = (props.items || []) as Array<Record<string, string>>;
      const backgroundColor = safeText(props.backgroundColor);
      const circleColor = safeText(props.circleColor);
      const lineColor = safeText(props.lineColor);
      const titleColor = safeText(props.titleColor);
      const subtitleColor = safeText(props.subtitleColor);
      const descriptionColor = safeText(props.descriptionColor);
      return wrap(
        <section
          className="py-12"
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
                <EditableText
                  value={safeText(props.heading)}
                  onCommit={(value) => onUpdateBlock(index, { heading: value })}
                  className="text-[var(--brand-navy)]"
                />
              </h2>
              <p className="mt-2 text-sm text-[var(--brand-blue)]">
                <EditableText
                  value={safeText(props.subheading)}
                  onCommit={(value) =>
                    onUpdateBlock(index, { subheading: value })
                  }
                  className="text-[var(--brand-blue)]"
                />
              </p>
            </div>
            <div className="relative grid gap-8 md:grid-cols-4">
              <div
                className="absolute left-0 right-0 top-6 hidden h-px md:block"
                style={{
                  backgroundColor: lineColor || "#cbd5f5",
                }}
              />
              {items.map((item, itemIndex) => (
                <div
                  key={`${item.step}-${itemIndex}`}
                  className="relative z-10 flex flex-col items-center gap-3 text-center"
                >
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold text-white shadow-lg"
                    style={{
                      backgroundColor: circleColor || "var(--brand-blue)",
                    }}
                  >
                    <EditableText
                      value={safeText(item.step)}
                      onCommit={(value) =>
                        updateItem("items", itemIndex, { step: value })
                      }
                      className="text-white"
                    />
                  </div>
                  <div
                    className="text-sm font-semibold"
                    style={{ color: titleColor || "var(--brand-navy)" }}
                  >
                    <EditableText
                      value={safeText(item.title)}
                      onCommit={(value) =>
                        updateItem("items", itemIndex, { title: value })
                      }
                      className="text-[var(--brand-navy)]"
                    />
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: subtitleColor || "var(--brand-blue)" }}
                  >
                    <EditableText
                      value={safeText(item.subtitle)}
                      onCommit={(value) =>
                        updateItem("items", itemIndex, { subtitle: value })
                      }
                      className="text-[var(--brand-blue)]"
                    />
                  </div>
                  {item.description && (
                    <div
                      className="text-xs"
                      style={{ color: descriptionColor || "#475569" }}
                    >
                      <EditableText
                        value={safeText(item.description)}
                        onCommit={(value) =>
                          updateItem("items", itemIndex, {
                            description: value,
                          })
                        }
                        className="text-slate-600"
                        multiline
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "ready-for-service") {
      const backgroundColor = safeText(props.backgroundColor);
      const bg = backgroundColor.toLowerCase();
      const isLight =
        !bg || bg === "#fff" || bg === "#ffffff" || bg === "white";
      const normalizeColor = (value: string) => value.trim().toLowerCase();
      const primaryCtaBackground = safeText(props.primaryCtaBackground);
      const primaryCtaTextColor = safeText(props.primaryCtaTextColor);
      let primaryBg =
        primaryCtaBackground || (isLight ? "#000000" : "var(--brand-yellow)");
      let primaryText =
        primaryCtaTextColor || (isLight ? "#ffffff" : "var(--brand-navy)");
      if (normalizeColor(primaryBg) === normalizeColor(primaryText)) {
        primaryText = "#ffffff";
      }
      const secondaryCtaBackground = safeText(props.secondaryCtaBackground);
      const secondaryCtaTextColor = safeText(props.secondaryCtaTextColor);
      const secondaryBg =
        secondaryCtaBackground || (isLight ? "#ffffff" : "transparent");
      const secondaryText =
        secondaryCtaTextColor || (isLight ? "#334155" : "#ffffff");
      const iconColor =
        safeText(props.iconColor) || (isLight ? "#0f172a" : "currentColor");
      const headingClass = isLight ? "text-slate-900" : "text-white";
      const descriptionClass = isLight ? "text-slate-600" : "text-white/80";
      const secondaryBorderClass = isLight ? "border-slate-300" : "border-white/30";
      const iconBgClass = isLight ? "bg-slate-100" : "bg-white/20";
      const primaryIcon = resolvePreviewImage(props.primaryIcon);
      const secondaryIcon = resolvePreviewImage(props.secondaryIcon);

      return wrap(
        <section
          className={`py-12 ${isLight ? "text-slate-900" : "text-white"}`}
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 text-center">
            <h2 className={`text-3xl font-semibold ${headingClass}`}>
              <EditableText
                value={safeText(props.heading)}
                onCommit={(value) => onUpdateBlock(index, { heading: value })}
                className={headingClass}
              />
            </h2>
            <p className={`text-sm ${descriptionClass}`}>
              <EditableText
                value={safeText(props.description)}
                onCommit={(value) =>
                  onUpdateBlock(index, { description: value })
                }
                className={descriptionClass}
                multiline
              />
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-lg"
                style={{
                  backgroundColor: primaryBg,
                  color: primaryText,
                }}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${iconBgClass}`}
                  style={{ color: iconColor }}
                >
                  {primaryIcon ? (
                    <img
                      src={primaryIcon}
                      alt=""
                      className="h-4 w-4 object-contain"
                    />
                  ) : (
                    "📄"
                  )}
                </span>
                <EditableText
                  value={safeText(props.primaryCtaText)}
                  onCommit={(value) =>
                    onUpdateBlock(index, { primaryCtaText: value })
                  }
                  className="text-inherit"
                />
              </button>
              <button
                type="button"
                className={`inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold ${secondaryBorderClass}`}
                style={{
                  backgroundColor: secondaryBg,
                  color: secondaryText,
                }}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${iconBgClass}`}
                  style={{ color: iconColor }}
                >
                  {secondaryIcon ? (
                    <img
                      src={secondaryIcon}
                      alt=""
                      className="h-4 w-4 object-contain"
                    />
                  ) : (
                    "📞"
                  )}
                </span>
                <EditableText
                  value={safeText(props.secondaryCtaText)}
                  onCommit={(value) =>
                    onUpdateBlock(index, { secondaryCtaText: value })
                  }
                  className="text-inherit"
                />
              </button>
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "our-portfolio") {
      const items = (props.items || []) as Array<Record<string, string>>;
      const backgroundColor = safeText(props.backgroundColor);
      const overlayColor = safeText(props.overlayColor) || "#0b3c86";
      const overlayOpacity = Number(props.overlayOpacity) || 0.65;
      const tileHeight = Number(props.tileHeight) || 176;

      return wrap(
        <section
          className="py-12"
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
                <EditableText
                  value={safeText(props.heading)}
                  onCommit={(value) => onUpdateBlock(index, { heading: value })}
                  className="text-[var(--brand-navy)]"
                />
              </h2>
              <p className="mt-2 text-sm text-[var(--brand-blue)]">
                <EditableText
                  value={safeText(props.subheading)}
                  onCommit={(value) =>
                    onUpdateBlock(index, { subheading: value })
                  }
                  className="text-[var(--brand-blue)]"
                />
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {items.map((item, itemIndex) => (
                <a
                  key={`${item.title}-${itemIndex}`}
                  className="relative overflow-hidden rounded-2xl"
                  href={safeText(item.href) || "#"}
                  target={item.newTab ? "_blank" : undefined}
                  rel={item.newTab ? "noreferrer" : undefined}
                  onClick={(event) => event.preventDefault()}
                >
                  {item.image && (
                    <img
                      src={resolvePreviewImage(item.image)}
                      alt={safeText(item.title)}
                      className="w-full object-cover"
                      style={{ height: tileHeight }}
                    />
                  )}
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundColor: overlayColor,
                      opacity: overlayOpacity,
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <p className="text-sm font-semibold">
                      <EditableText
                        value={safeText(item.title)}
                        onCommit={(value) =>
                          updateItem("items", itemIndex, { title: value })
                        }
                        className="text-white"
                      />
                    </p>
                    <p className="text-xs text-white/80">
                      <EditableText
                        value={safeText(item.subtitle)}
                        onCommit={(value) =>
                          updateItem("items", itemIndex, { subtitle: value })
                        }
                        className="text-white/80"
                      />
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "our-work") {
      const items = (props.items || []) as Array<Record<string, string>>;
      const backgroundColor = safeText(props.backgroundColor);
      const bg = backgroundColor.toLowerCase();
      const isLight =
        !bg || bg === "#fff" || bg === "#ffffff" || bg === "white";
      const headingClass = isLight ? "text-slate-900" : "text-white";
      const subheadingClass = isLight ? "text-slate-500" : "text-white/70";
      const descriptionClass = isLight ? "text-slate-600" : "text-white/80";
      return wrap(
        <section
          className="py-16"
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6">
            <div className="text-center">
              <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${subheadingClass}`}>
                <EditableText
                  value={safeText(props.subheading)}
                  onCommit={(value) =>
                    onUpdateBlock(index, { subheading: value })
                  }
                  className={subheadingClass}
                />
              </p>
              <h2 className={`mt-3 text-3xl font-semibold ${headingClass}`}>
                <EditableText
                  value={safeText(props.heading)}
                  onCommit={(value) => onUpdateBlock(index, { heading: value })}
                  className={headingClass}
                />
              </h2>
              <p className={`mt-3 text-sm ${descriptionClass}`}>
                <EditableText
                  value={safeText(props.description)}
                  onCommit={(value) =>
                    onUpdateBlock(index, { description: value })
                  }
                  className={descriptionClass}
                  multiline
                />
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {items.map((item, itemIndex) => (
                <div
                  key={`${item.title}-${itemIndex}`}
                  className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-blue-900/10"
                >
                  <div className="h-48 w-full overflow-hidden">
                    {item.image ? (
                      <img
                        src={resolvePreviewImage(item.image)}
                        alt={safeText(item.title)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 px-5 py-4">
                    <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-navy)]">
                      <EditableText
                        value={safeText(item.title)}
                        onCommit={(value) =>
                          updateItem("items", itemIndex, { title: value })
                        }
                        className="text-[var(--brand-navy)]"
                      />
                    </p>
                    <p className="text-sm text-slate-600">
                      <EditableText
                        value={safeText(item.subtitle)}
                        onCommit={(value) =>
                          updateItem("items", itemIndex, { subtitle: value })
                        }
                        className="text-slate-600"
                      />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "our-work-gallery") {
      const images = (props.images || []) as Array<Record<string, string>>;
      const backgroundColor = safeText(props.backgroundColor);
      return wrap(
        <section
          className="py-16"
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand-orange)]">
                <EditableText
                  value={safeText(props.subheading)}
                  onCommit={(value) =>
                    onUpdateBlock(index, { subheading: value })
                  }
                  className="text-[var(--brand-orange)]"
                />
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--brand-navy)]">
                <EditableText
                  value={safeText(props.heading)}
                  onCommit={(value) => onUpdateBlock(index, { heading: value })}
                  className="text-[var(--brand-navy)]"
                />
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((image, itemIndex) => (
                <div
                  key={`${image.url}-${itemIndex}`}
                  className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-blue-900/10"
                >
                  <div className="h-48 w-full overflow-hidden">
                    {image.url ? (
                      <img
                        src={resolvePreviewImage(image.url)}
                        alt={safeText(image.caption)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-3 text-sm text-slate-600">
                    <EditableText
                      value={safeText(image.caption)}
                      onCommit={(value) =>
                        updateItem("images", itemIndex, { caption: value })
                      }
                      className="text-slate-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "grand-events") {
      const backgroundColor = safeText(props.backgroundColor);
      const ctaBackground = safeText(props.ctaBackground) || "#6b6f2d";
      const ctaTextColor = safeText(props.ctaTextColor) || "#ffffff";
      return wrap(
        <section
          className="py-16"
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
                <EditableText
                  value={safeText(props.heading)}
                  onCommit={(value) => onUpdateBlock(index, { heading: value })}
                  className="text-[var(--brand-navy)]"
                />
              </h2>
              <p className="text-sm text-slate-700">
                <EditableText
                  value={safeText(props.description)}
                  onCommit={(value) =>
                    onUpdateBlock(index, { description: value })
                  }
                  className="text-slate-700"
                  multiline
                />
              </p>
              <span
                className="inline-flex rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-wide shadow-lg shadow-slate-900/10"
                style={{ backgroundColor: ctaBackground, color: ctaTextColor }}
              >
                <EditableText
                  value={safeText(props.ctaText)}
                  onCommit={(value) => onUpdateBlock(index, { ctaText: value })}
                  className="text-inherit"
                />
              </span>
            </div>
            <div className="grid grid-cols-[1fr_0.9fr] grid-rows-2 gap-4">
              <div className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-slate-900/10">
                <div className="h-48 w-full overflow-hidden">
                  {props.imageTop ? (
                    <img
                      src={resolvePreviewImage(props.imageTop)}
                      alt={safeText(props.heading)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      No image
                    </div>
                  )}
                </div>
              </div>
              <div className="row-span-2 overflow-hidden rounded-3xl bg-white shadow-lg shadow-slate-900/10">
                <div className="h-full min-h-[240px] w-full overflow-hidden">
                  {props.imageSide ? (
                    <img
                      src={resolvePreviewImage(props.imageSide)}
                      alt={safeText(props.heading)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      No image
                    </div>
                  )}
                </div>
              </div>
              <div className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-slate-900/10">
                <div className="h-48 w-full overflow-hidden">
                  {props.imageBottom ? (
                    <img
                      src={resolvePreviewImage(props.imageBottom)}
                      alt={safeText(props.heading)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      No image
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "wellness-facilities") {
      const items = (props.items || []) as Array<Record<string, string>>;
      const backgroundColor = safeText(props.backgroundColor);
      return wrap(
        <section
          className="py-16"
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6">
            {items.map((item, itemIndex) => {
              const imageFirst = itemIndex % 2 === 1;
              return (
                <div
                  key={`${item.title}-${itemIndex}`}
                  className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center"
                >
                  <div className={imageFirst ? "order-2 lg:order-2" : "order-2 lg:order-1"}>
                    <div className="space-y-4">
                      <h3 className="text-3xl font-semibold text-[var(--brand-navy)] font-serif">
                        <EditableText
                          value={safeText(item.title)}
                          onCommit={(value) =>
                            updateItem("items", itemIndex, { title: value })
                          }
                          className="text-[var(--brand-navy)]"
                        />
                      </h3>
                      <p className="text-sm text-slate-600">
                        <EditableText
                          value={safeText(item.description)}
                          onCommit={(value) =>
                            updateItem("items", itemIndex, {
                              description: value,
                            })
                          }
                          className="text-slate-600"
                          multiline
                        />
                      </p>
                      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-orange)]">
                        <EditableText
                          value={safeText(item.ctaText)}
                          onCommit={(value) =>
                            updateItem("items", itemIndex, { ctaText: value })
                          }
                          className="text-[var(--brand-orange)]"
                        />
                        <span aria-hidden="true">›</span>
                      </div>
                    </div>
                  </div>
                  <div className={imageFirst ? "order-1 lg:order-1" : "order-1 lg:order-2"}>
                    <div className="overflow-hidden rounded-3xl bg-slate-100 shadow-xl shadow-slate-900/10">
                      {item.image ? (
                        <img
                          src={resolvePreviewImage(item.image)}
                          alt={safeText(item.title)}
                          className="h-64 w-full object-cover md:h-72"
                        />
                      ) : (
                        <div className="flex h-64 items-center justify-center text-xs text-slate-400">
                          No image
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    if (block.type === "images-slider") {
      const images = (props.images || []) as Array<Record<string, string>>;
      const backgroundColor = safeText(props.backgroundColor);
      return wrap(
        <section
          className="py-16"
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand-orange)]">
                <EditableText
                  value={safeText(props.subheading)}
                  onCommit={(value) =>
                    onUpdateBlock(index, { subheading: value })
                  }
                  className="text-[var(--brand-orange)]"
                />
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--brand-navy)]">
                <EditableText
                  value={safeText(props.heading)}
                  onCommit={(value) => onUpdateBlock(index, { heading: value })}
                  className="text-[var(--brand-navy)]"
                />
              </h2>
            </div>
            <ImageSliderPreview
              images={images}
              onCaptionChange={(itemIndex, value) =>
                updateItem("images", itemIndex, { caption: value })
              }
            />
          </div>
        </section>
      );
    }

    if (block.type === "services") {
      const items = (props.items || []) as Array<Record<string, string>>;
      const backgroundColor = safeText(props.backgroundColor);
      return wrap(
        <section
          id="services"
          className="py-16"
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col gap-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--brand-navy)]">
                Services
              </p>
              <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
                <EditableText
                  value={safeText(props.title)}
                  onCommit={(value) => onUpdateBlock(index, { title: value })}
                  className="text-[var(--brand-navy)]"
                />
              </h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {items.map((service, itemIndex) => (
                <div
                  key={`${service.title}-${itemIndex}`}
                  className="flex h-full flex-col justify-between rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-blue-900/10"
                >
                  <div>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-yellow)] text-[var(--brand-navy)]">
                      ★
                    </div>
                    <h3 className="text-xl font-semibold text-[var(--brand-navy)]">
                      <EditableText
                        value={safeText(service.title)}
                        onCommit={(value) =>
                          updateItem("items", itemIndex, { title: value })
                        }
                        className="text-[var(--brand-navy)]"
                      />
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                      <EditableText
                        value={safeText(service.description)}
                        onCommit={(value) =>
                          updateItem("items", itemIndex, {
                            description: value,
                          })
                        }
                        className="text-slate-600"
                        multiline
                      />
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--brand-orange)]">
                      <EditableText
                        value={safeText(service.price)}
                        onCommit={(value) =>
                          updateItem("items", itemIndex, { price: value })
                        }
                        className="text-[var(--brand-orange)]"
                      />
                    </span>
                    <span className="rounded-full bg-[var(--brand-blue)] px-4 py-2 text-xs font-semibold text-white">
                      <EditableText
                        value={safeText(service.ctaText) || "จองบริการ"}
                        onCommit={(value) =>
                          updateItem("items", itemIndex, { ctaText: value })
                        }
                        className="text-white"
                      />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (
      block.type === "our-services-v2" ||
      block.type === "products-section-images"
    ) {
      const items = (props.items || []) as Array<Record<string, string>>;
      const backgroundColor = safeText(props.backgroundColor);
      return wrap(
        <section
          className="py-16"
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--brand-orange)]">
              <EditableText
                value={safeText(props.eyebrow)}
                onCommit={(value) => onUpdateBlock(index, { eyebrow: value })}
                className="text-[var(--brand-orange)]"
              />
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--brand-navy)]">
              <EditableText
                value={safeText(props.title)}
                onCommit={(value) => onUpdateBlock(index, { title: value })}
                className="text-[var(--brand-navy)]"
              />
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {items.map((service, itemIndex) => (
                <div key={`${service.title}-${itemIndex}`} className="grid gap-4">
                  <div className="overflow-hidden rounded-[32px] bg-slate-100">
                    {service.image && (
                      <img
                        src={resolvePreviewImage(service.image)}
                        alt={safeText(service.title)}
                        className="h-52 w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-[var(--brand-navy)]">
                      <EditableText
                        value={safeText(service.title)}
                        onCommit={(value) =>
                          updateItem("items", itemIndex, { title: value })
                        }
                        className="text-[var(--brand-navy)]"
                      />
                    </h3>
                    <p className="text-sm text-slate-600">
                      <EditableText
                        value={safeText(service.description)}
                        onCommit={(value) =>
                          updateItem("items", itemIndex, {
                            description: value,
                          })
                        }
                        className="text-slate-600"
                        multiline
                      />
                    </p>
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-orange)]">
                      <EditableText
                        value={safeText(service.ctaText)}
                        onCommit={(value) =>
                          updateItem("items", itemIndex, { ctaText: value })
                        }
                        className="text-[var(--brand-orange)]"
                      />
                      <span aria-hidden="true">→</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "features") {
      const items = (props.items || []) as Array<Record<string, string>>;
      const backgroundColor = safeText(props.backgroundColor);
      return wrap(
        <section
          className="bg-[var(--brand-navy)] py-16 text-white"
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          <div className="mx-auto grid max-w-6xl gap-8 px-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-semibold">
                <EditableText
                  value={safeText(props.title)}
                  onCommit={(value) => onUpdateBlock(index, { title: value })}
                  className="text-white"
                />
              </h2>
              <p className="mt-4 text-sm text-slate-200">
                เราออกแบบประสบการณ์ตั้งแต่จองคิวจนถึงหลังบริการ เพื่อให้คุณมั่นใจ
                ว่างานเสร็จตามมาตรฐานและมีการติดตามผลอย่างมืออาชีพ
              </p>
            </div>
            <div className="grid gap-4">
              {items.map((item, itemIndex) => (
                <div
                  key={`${item.text}-${itemIndex}`}
                  className="rounded-2xl bg-white/10 px-4 py-3 text-sm"
                >
                  <EditableText
                    value={safeText(item.text)}
                    onCommit={(value) =>
                      updateItem("items", itemIndex, { text: value })
                    }
                    className="text-white"
                    multiline
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "gallery") {
      const images = (props.images || []) as Array<Record<string, string>>;
      const backgroundColor = safeText(props.backgroundColor);
      return wrap(
        <section
          className="mx-auto max-w-6xl px-6 py-16"
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          <h2 className="text-2xl font-semibold text-[var(--brand-navy)]">
            <EditableText
              value={safeText(props.title)}
              onCommit={(value) => onUpdateBlock(index, { title: value })}
              className="text-[var(--brand-navy)]"
            />
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {images.map((image, itemIndex) => (
              <div
                key={`${image.url}-${itemIndex}`}
                className="overflow-hidden rounded-2xl bg-white shadow"
              >
                <img
                  src={resolvePreviewImage(image.url)}
                  alt={safeText(image.caption)}
                  className="h-48 w-full object-cover"
                />
                <div className="px-4 py-3 text-sm text-slate-600">
                  <EditableText
                    value={safeText(image.caption)}
                    onCommit={(value) =>
                      updateItem("images", itemIndex, { caption: value })
                    }
                    className="text-slate-600"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (block.type === "faq") {
      const items = (props.items || []) as Array<Record<string, string>>;
      const backgroundColor = safeText(props.backgroundColor);
      return wrap(
        <section
          className="mx-auto max-w-6xl px-6 pb-16"
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          <div className="rounded-3xl bg-white/80 p-8 shadow-xl shadow-blue-900/10">
            <h2 className="text-2xl font-semibold text-[var(--brand-navy)]">
              <EditableText
                value={safeText(props.title)}
                onCommit={(value) => onUpdateBlock(index, { title: value })}
                className="text-[var(--brand-navy)]"
              />
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {items.map((faq, itemIndex) => (
                <div
                  key={`${faq.question}-${itemIndex}`}
                  className="rounded-2xl border border-slate-100 bg-white/90 p-4 text-sm"
                >
                  <p className="font-semibold text-[var(--brand-navy)]">
                    <EditableText
                      value={safeText(faq.question)}
                      onCommit={(value) =>
                        updateItem("items", itemIndex, { question: value })
                      }
                      className="text-[var(--brand-navy)]"
                      multiline
                    />
                  </p>
                  <p className="mt-2 text-slate-600">
                    <EditableText
                      value={safeText(faq.answer)}
                      onCommit={(value) =>
                        updateItem("items", itemIndex, { answer: value })
                      }
                      className="text-slate-600"
                      multiline
                    />
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "frequently-asked-questions") {
      const items = (props.items || []) as Array<Record<string, string>>;
      const backgroundColor = safeText(props.backgroundColor);
      return wrap(
        <section
          className="px-6 py-16"
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
              <EditableText
                value={safeText(props.title)}
                onCommit={(value) => onUpdateBlock(index, { title: value })}
                className="text-[var(--brand-navy)]"
              />
            </h2>
            <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand-navy)]/70">
              <EditableText
                value={safeText(props.subtitle)}
                onCommit={(value) => onUpdateBlock(index, { subtitle: value })}
                className="text-[var(--brand-navy)]/70"
              />
            </p>
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-4">
            {items.map((faq, itemIndex) => (
              <details
                key={`${faq.question}-${itemIndex}`}
                className="group rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-left [&::-webkit-details-marker]:hidden">
                  <span className="text-base font-semibold text-[var(--brand-navy)]">
                    <EditableText
                      value={safeText(faq.question)}
                      onCommit={(value) =>
                        updateItem("items", itemIndex, { question: value })
                      }
                      className="text-[var(--brand-navy)]"
                      multiline
                    />
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-[var(--brand-navy)] transition-transform duration-200 group-open:rotate-180">
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-4 w-4"
                    >
                      <path
                        d="M5.5 7.5l4.5 4.5 4.5-4.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-5 text-sm text-slate-600">
                  <EditableText
                    value={safeText(faq.answer)}
                    onCommit={(value) =>
                      updateItem("items", itemIndex, { answer: value })
                    }
                    className="text-slate-600"
                    multiline
                  />
                </div>
              </details>
            ))}
          </div>
        </section>
      );
    }

    if (block.type === "contact") {
      const backgroundColor = safeText(props.backgroundColor);
      return wrap(
        <section
          id="booking"
          className="mx-auto max-w-6xl px-6 py-16"
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/10">
              <h3 className="text-2xl font-semibold text-slate-900">
                <EditableText
                  value={safeText(props.title) || "จองคิวบริการ"}
                  onCommit={(value) => onUpdateBlock(index, { title: value })}
                  className="text-slate-900"
                />
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                กรอกข้อมูลแล้วทีมงานจะโทรกลับภายใน 15 นาทีในเวลาทำการ
              </p>
              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-500">
                  ชื่อ-นามสกุล
                </div>
                <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-500">
                  เบอร์โทรศัพท์
                </div>
                <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-500">
                  รายละเอียดบริการที่ต้องการ
                </div>
                <div className="rounded-full bg-black px-6 py-3 text-center text-sm font-semibold text-white">
                  <EditableText
                    value={safeText(props.ctaText) || "ส่งข้อมูลให้ทีมงานติดต่อกลับ"}
                    onCommit={(value) => onUpdateBlock(index, { ctaText: value })}
                    className="text-white"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/10">
              <h3 className="text-xl font-semibold text-slate-900">ติดต่อเรา</h3>
              <div className="mt-4 grid gap-3 text-sm text-slate-600">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>โทร</span>
                  <strong className="text-slate-900">
                    <EditableText
                      value={safeText(props.phone)}
                      onCommit={(value) => onUpdateBlock(index, { phone: value })}
                      className="text-slate-900"
                    />
                  </strong>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <EditableText
                    value={safeText(props.note)}
                    onCommit={(value) => onUpdateBlock(index, { note: value })}
                    className="text-slate-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (block.type === "top-products-sales") {
      const backgroundColor = safeText(props.backgroundColor);
      const selectedProducts = (props.selectedProducts || []) as Array<{
        id: string;
        name: string;
        slug: string;
        image?: string;
        code?: string;
      }>;

      return wrap(
        <section
          className="py-12"
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          <div className="mx-auto max-w-7xl px-6">
            {/* Header */}
            {props.heading && (
              <div className="mb-8">
                {props.subheading && (
                  <p className="text-sm text-slate-500">
                    <EditableText
                      value={safeText(props.subheading)}
                      onCommit={(value) => onUpdateBlock(index, { subheading: value })}
                      className="text-slate-500"
                    />
                  </p>
                )}
                <h2 className="text-2xl font-bold text-[#8b1538]">
                  <EditableText
                    value={safeText(props.heading)}
                    onCommit={(value) => onUpdateBlock(index, { heading: value })}
                    className="text-[#8b1538]"
                  />
                </h2>
              </div>
            )}

            {selectedProducts.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-200">
                  <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-slate-600">ยังไม่ได้เลือกสินค้า</p>
                <p className="mt-1 text-sm text-slate-500">กรุณาเลือกสินค้าจาก Editor Panel ทางด้านซ้าย</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {selectedProducts.map((product) => (
                  <div key={product.id} className="group cursor-pointer rounded-xl p-3 transition-all hover:bg-slate-50 hover:shadow-lg">
                    {/* Product Image */}
                    <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-[#f5f5f5]">
                      {product.image ? (
                        <img
                          src={resolveUploadUrl(product.image)}
                          alt={product.name}
                          className="h-full w-full object-contain p-4"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {/* Product Code */}
                    {product.code && (
                      <p className="mt-3 text-sm font-medium text-slate-400">{product.code}</p>
                    )}
                    {/* Product Name */}
                    <h3 className="mt-1 text-sm leading-snug text-slate-900 group-hover:text-[#8b1538]">
                      {product.name}
                    </h3>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      );
    }

    if (block.type === "featured-categories") {
      const backgroundColor = safeText(props.backgroundColor);
      const selectedCategories = (props.selectedCategories || []) as Array<{
        id: string;
        name: string;
        slug: string;
        logo?: string;
      }>;
      const exploreText = safeText(props.exploreText) || "EXPLORE ALL";

      return wrap(
        <section
          className="py-12"
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          <div className="mx-auto max-w-7xl px-6">
            {/* Header */}
            {props.heading && (
              <h2 className="mb-8 text-2xl font-bold text-slate-900">
                <EditableText
                  value={safeText(props.heading)}
                  onCommit={(value) => onUpdateBlock(index, { heading: value })}
                  className="text-slate-900"
                />
              </h2>
            )}

            {selectedCategories.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-200">
                  <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-slate-600">ยังไม่ได้เลือกหมวดหมู่</p>
                <p className="mt-1 text-sm text-slate-500">กรุณาเลือกหมวดหมู่จาก Editor Panel ทางด้านซ้าย</p>
              </div>
            ) : (
              <div className="flex gap-6 overflow-x-auto pb-4">
                {selectedCategories.map((category) => (
                  <div key={category.id} className="group flex-shrink-0 cursor-pointer" style={{ width: "220px" }}>
                    {/* Category Image */}
                    <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-[#f5f5f5]">
                      {category.logo ? (
                        <img
                          src={resolveUploadUrl(category.logo)}
                          alt={category.name}
                          className="h-full w-full object-contain p-4 transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {/* Category Name */}
                    <h3 className="mt-4 text-center text-sm font-bold uppercase tracking-wide text-slate-900">
                      {category.name}
                    </h3>
                    {/* Explore Link */}
                    <p className="mt-1 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
                      {exploreText} »
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      );
    }

    if (block.type === "hero-images-with-button") {
      const backgroundImage = resolvePreviewImage(props.backgroundImage);
      const overlayOpacity = (props.overlayOpacity as number) || 0.5;
      const buttonColor = safeText(props.buttonColor) || "#f59e0b";
      const buttonTextColor = safeText(props.buttonTextColor) || "#000000";

      return wrap(
        <section className="relative min-h-[320px] overflow-hidden sm:min-h-[420px] md:min-h-[520px] lg:min-h-[600px]">
          {/* Background Image */}
          {backgroundImage ? (
            <img
              src={resolveUploadUrl(backgroundImage)}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-slate-800" />
          )}

          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: overlayOpacity }}
          />

          {/* Content */}
          <div className="relative z-10 flex min-h-[320px] flex-col items-center justify-center px-4 py-12 text-center text-white sm:min-h-[420px] sm:px-6 sm:py-16 md:min-h-[520px] md:py-20 lg:min-h-[600px]">
            <h1 className="max-w-[720px] text-2xl font-bold uppercase tracking-wide sm:text-3xl md:text-4xl lg:text-5xl">
              <EditableText
                value={safeText(props.title) || "BUILT FOR THE UNBREAKABLE™"}
                onCommit={(value) => onUpdateBlock(index, { title: value })}
                className="text-white"
              />
            </h1>
            <p className="mt-4 max-w-xl text-xs text-slate-200 sm:mt-6 sm:max-w-2xl sm:text-base md:text-lg">
              <EditableText
                value={safeText(props.description)}
                onCommit={(value) => onUpdateBlock(index, { description: value })}
                className="text-slate-200"
              />
            </p>
            <a
              href={safeText(props.buttonHref) || "#"}
              className="mt-6 inline-block px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all hover:opacity-90 sm:mt-8 sm:px-8 sm:py-3 sm:text-sm"
              style={{ backgroundColor: buttonColor, color: buttonTextColor }}
            >
              <EditableText
                value={safeText(props.buttonText) || "LEARN MORE"}
                onCommit={(value) => onUpdateBlock(index, { buttonText: value })}
              />
            </a>
          </div>
        </section>
      );
    }

    return null;
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="preview-scope"
      style={background ? { background } : undefined}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={blocks.map((block) => block.uid)}
          strategy={verticalListSortingStrategy}
        >
          {blocks.map(renderBlock)}
        </SortableContext>
      </DndContext>
      <style jsx global>{`
        .preview-scope *:hover {
          outline: 1px dashed rgba(59, 130, 246, 0.6);
          outline-offset: 2px;
        }
        .preview-scope [data-preview-selected="true"] {
          outline: 2px solid rgba(37, 99, 235, 0.9);
          outline-offset: 2px;
        }
        .preview-scope {
          color: #111111;
          background-color: #ffffff;
          --brand-blue: #111111;
          --brand-navy: #111111;
          --brand-yellow: #111111;
          --brand-orange: #111111;
        }
        .preview-scope [class*="text-white"] {
          color: #111111 !important;
        }
        .preview-scope [class*="text-white/80"] {
          color: rgba(17, 17, 17, 0.8) !important;
        }
        .preview-scope [class*="text-white/70"] {
          color: rgba(17, 17, 17, 0.7) !important;
        }
        .preview-scope [class*="bg-[var(--brand-blue)]"] {
          background-color: #111111 !important;
          color: #ffffff !important;
        }
        .preview-scope [class*="bg-[var(--brand-yellow)]"] {
          background-color: #111111 !important;
          color: #ffffff !important;
        }
        .preview-scope [class*="bg-[var(--brand-blue)]"] [class*="text-white"],
        .preview-scope [class*="bg-[var(--brand-yellow)]"] [class*="text-white"] {
          color: #ffffff !important;
        }
        .preview-scope [class*="bg-[var(--brand-blue)]"] [class*="text-white/80"],
        .preview-scope
          [class*="bg-[var(--brand-yellow)]"]
          [class*="text-white/80"] {
          color: rgba(255, 255, 255, 0.8) !important;
        }
      `}</style>
    </div>
  );
}

function SortablePreviewSection({
  id,
  index,
  active,
  onSelect,
  onDelete,
  dropTarget,
  onDropHover,
  children,
}: {
  id: string;
  index: number;
  active: boolean;
  onSelect: (index: number) => void;
  onDelete: (index: number) => void;
  dropTarget: { index: number; position: "before" | "after" } | null;
  onDropHover: (index: number, position: "before" | "after") => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <section
      ref={setNodeRef}
      style={style}
      data-block-index={index}
      onClick={() => onSelect(index)}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("block-type")) return;
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        const isAfter = event.clientY - rect.top > rect.height / 2;
        onDropHover(index, isAfter ? "after" : "before");
      }}
      className={`relative cursor-pointer transition ${active
          ? "outline outline-2 outline-blue-500"
          : "hover:outline hover:outline-2 hover:outline-blue-300"
        }`}
    >
      {dropTarget?.index === index && dropTarget.position === "before" && (
        <div className="pointer-events-none mb-4 rounded-2xl border-2 border-dashed border-blue-400 bg-blue-50/70 px-4 py-4 text-center text-xs font-semibold text-blue-700 shadow-sm">
          Drop to insert block
        </div>
      )}
      <button
        className="absolute left-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-600 shadow"
        {...attributes}
        {...listeners}
        onClick={(event) => event.stopPropagation()}
      >
        Drag
      </button>
      <button
        className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-rose-600 shadow"
        onClick={(event) => {
          event.stopPropagation();
          onDelete(index);
        }}
      >
        Delete
      </button>
      {children}
      {dropTarget?.index === index && dropTarget.position === "after" && (
        <div className="pointer-events-none mt-4 rounded-2xl border-2 border-dashed border-blue-400 bg-blue-50/70 px-4 py-4 text-center text-xs font-semibold text-blue-700 shadow-sm">
          Drop to insert block
        </div>
      )}
    </section>
  );
}

function HeroImagesPreview({
  images,
}: {
  images: Array<Record<string, string>>;
}) {
  const [index, setIndex] = useState(0);
  const total = images.length;
  const current = images[index] || images[0];

  if (!current) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-slate-400 sm:h-[360px] md:h-[480px] lg:h-[600px]">
        No hero images yet.
      </div>
    );
  }

  const goPrev = () => setIndex((prev) => (prev - 1 + total) % total);
  const goNext = () => setIndex((prev) => (prev + 1) % total);

  return (
    <div className="relative h-[260px] w-full overflow-hidden bg-white sm:h-[360px] md:h-[480px] lg:h-[600px]">
      <img
        src={resolvePreviewImage(current.image)}
        alt={safeText(current.title) || "Hero slide"}
        className="h-full w-full object-contain"
      />
      <div className="absolute inset-0 bg-transparent" />
      <button
        onClick={goPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow"
      >
        ‹
      </button>
      <button
        onClick={goNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow"
      >
        ›
      </button>
      <div className="absolute bottom-4 right-4 rounded-full bg-white/80 px-3 py-1 text-[11px] text-slate-600">
        {index + 1}/{total}
      </div>
      <div className="absolute bottom-6 left-6 text-sm font-semibold text-slate-800">
        {safeText(current.title)}
      </div>
      <div className="absolute bottom-2 left-6 text-xs text-slate-600">
        {safeText(current.subtitle)}
      </div>
    </div>
  );
}

function EditableText({
  value,
  onCommit,
  className,
  multiline,
}: {
  value: string;
  onCommit: (next: string) => void;
  className?: string;
  multiline?: boolean;
}) {
  return (
    <span
      className={`inline-block rounded-md px-1 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 ${className || ""}`}
      contentEditable
      suppressContentEditableWarning
      onKeyDown={(event) => {
        if (!multiline && event.key === "Enter") {
          event.preventDefault();
          (event.currentTarget as HTMLElement).blur();
        }
      }}
      onBlur={(event) =>
        onCommit(event.currentTarget.textContent?.trim() || "")
      }
    >
      {value}
    </span>
  );
}

function AchievementMetric({
  item,
  onChange,
}: {
  item: Record<string, string>;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {item.icon && (
        <img
          src={resolvePreviewImage(item.icon)}
          alt=""
          className="h-8 w-8 object-contain"
        />
      )}
      <div className="text-3xl font-semibold text-white">
        <EditableText
          value={safeText(item.value)}
          onCommit={(value) => onChange({ value })}
          className="text-white"
        />
      </div>
      <div className="text-sm font-semibold text-white">
        <EditableText
          value={safeText(item.label)}
          onCommit={(value) => onChange({ label: value })}
          className="text-white"
        />
      </div>
      <div className="text-xs text-slate-200">
        <EditableText
          value={safeText(item.sublabel)}
          onCommit={(value) => onChange({ sublabel: value })}
          className="text-slate-200"
        />
      </div>
    </div>
  );
}
