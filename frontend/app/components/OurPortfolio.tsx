import React from "react";
import { resolveUploadUrl } from "@/lib/urls";

type PortfolioItem = {
  image?: string;
  title?: string;
  subtitle?: string;
  href?: string;
  newTab?: boolean;
};

type OurPortfolioProps = {
  backgroundColor?: string;
  heading?: string;
  subheading?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  tileHeight?: number;
  items?: PortfolioItem[];
};

const safeText = (value?: string) => (value ? String(value) : "");
const resolveImage = (value?: string) => resolveUploadUrl(safeText(value));

export default function OurPortfolio({
  backgroundColor,
  heading,
  subheading,
  overlayColor,
  overlayOpacity,
  tileHeight,
  items = [],
}: OurPortfolioProps) {
  const backgroundStyle = safeText(backgroundColor)
    ? { backgroundColor: safeText(backgroundColor) }
    : undefined;
  const resolvedOverlayColor = safeText(overlayColor) || "#0b3c86";
  const resolvedOverlayOpacity =
    Number.isFinite(Number(overlayOpacity)) && Number(overlayOpacity) >= 0
      ? Number(overlayOpacity)
      : 0.65;
  const resolvedTileHeight = Number(tileHeight) || 176;

  return (
    <section className="py-12" style={backgroundStyle}>
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
            {safeText(heading)}
          </h2>
          <p className="mt-2 text-sm text-[var(--brand-blue)]">
            {safeText(subheading)}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item, index) => (
            <a
              key={`${item.title}-${index}`}
              className="relative overflow-hidden rounded-2xl"
              href={safeText(item.href) || "#"}
              target={item.newTab ? "_blank" : undefined}
              rel={item.newTab ? "noreferrer" : undefined}
            >
              {item.image && (
                <img
                  src={resolveImage(item.image)}
                  alt={safeText(item.title)}
                  className="w-full object-cover"
                  style={{ height: resolvedTileHeight }}
                />
              )}
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: resolvedOverlayColor,
                  opacity: Math.max(0, Math.min(1, resolvedOverlayOpacity)),
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <p className="text-sm font-semibold">{safeText(item.title)}</p>
                <p className="text-xs text-white/80">
                  {safeText(item.subtitle)}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
