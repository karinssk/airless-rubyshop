import React from "react";
import { resolveUploadUrl } from "@/lib/urls";

type CoreServiceItem = {
  image?: string;
  icon?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaHref?: string;
};

type OurCoreServicesProps = {
  backgroundColor?: string;
  heading?: string;
  subheading?: string;
  cardBackgroundColor?: string;
  ctaBackgroundColor?: string;
  ctaTextColor?: string;
  imageHeight?: number;
  cardMinHeight?: number;
  items?: CoreServiceItem[];
};

const safeText = (value?: string) => (value ? String(value) : "");
const resolveImage = (value?: string) => resolveUploadUrl(safeText(value));

export default function OurCoreServices({
  backgroundColor,
  heading,
  subheading,
  cardBackgroundColor,
  ctaBackgroundColor,
  ctaTextColor,
  imageHeight,
  cardMinHeight,
  items = [],
}: OurCoreServicesProps) {
  const backgroundStyle = safeText(backgroundColor)
    ? { backgroundColor: safeText(backgroundColor) }
    : undefined;
  const cardStyle = safeText(cardBackgroundColor)
    ? { backgroundColor: safeText(cardBackgroundColor) }
    : undefined;
  const resolvedImageHeight = Number(imageHeight) || 176;
  const resolvedCardMinHeight = Number(cardMinHeight) || 0;

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
        <div className="grid gap-6 md:grid-cols-4">
          {items.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              className="overflow-hidden rounded-3xl shadow-xl shadow-black/10"
              style={{
                ...cardStyle,
                minHeight: resolvedCardMinHeight || undefined,
              }}
            >
              <div
                className="w-full bg-slate-100"
                style={{ height: resolvedImageHeight }}
              >
                {item.image && (
                  <img
                    src={resolveImage(item.image)}
                    alt={safeText(item.title)}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="grid gap-3 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-blue)] text-white">
                  {item.icon ? (
                    <img
                      src={resolveImage(item.icon)}
                      alt=""
                      className="h-5 w-5 object-contain brightness-0 invert"
                    />
                  ) : (
                    <span className="text-xs">★</span>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--brand-navy)]">
                    {safeText(item.title)}
                  </h3>
                  <p className="text-sm text-[var(--brand-blue)]">
                    {safeText(item.subtitle)}
                  </p>
                </div>
                <p className="text-sm text-slate-600">
                  {safeText(item.description)}
                </p>
                <a
                  href={safeText(item.ctaHref) || "#"}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold shadow-sm"
                  style={{
                    backgroundColor:
                      safeText(ctaBackgroundColor) || "var(--brand-yellow)",
                    color: safeText(ctaTextColor) || "var(--brand-navy)",
                  }}
                >
                  {safeText(item.ctaText) || "เรียนรู้เพิ่มเติม"}
                  <span>→</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
