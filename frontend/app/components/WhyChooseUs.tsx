import React from "react";
import { resolveUploadUrl } from "@/lib/urls";

type WhyChooseItem = {
  title?: string;
  subtitle?: string;
  description?: string;
  icon?: string;
};

type WhyChooseUsProps = {
  backgroundColor?: string;
  heading?: string;
  subheading?: string;
  cardBackgroundColor?: string;
  items?: WhyChooseItem[];
};

const safeText = (value?: string) => (value ? String(value) : "");
const resolveImage = (value?: string) => resolveUploadUrl(safeText(value));

export default function WhyChooseUs({
  backgroundColor,
  heading,
  subheading,
  cardBackgroundColor,
  items = [],
}: WhyChooseUsProps) {
  const backgroundStyle = safeText(backgroundColor)
    ? { backgroundColor: safeText(backgroundColor) }
    : undefined;
  const cardStyle = safeText(cardBackgroundColor)
    ? { backgroundColor: safeText(cardBackgroundColor) }
    : undefined;

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
              className="rounded-3xl p-6 shadow-xl shadow-black/10"
              style={cardStyle}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-blue)] text-white">
                {item.icon ? (
                  <img
                    src={resolveImage(item.icon)}
                    alt=""
                    className="h-6 w-6 object-contain brightness-0 invert"
                  />
                ) : (
                  <span className="text-sm">★</span>
                )}
              </div>
              <h3 className="mt-4 text-base font-semibold text-[var(--brand-navy)]">
                {safeText(item.title)}
              </h3>
              <p className="text-sm text-[var(--brand-blue)]">
                {safeText(item.subtitle)}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {safeText(item.description)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
