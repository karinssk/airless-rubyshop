import React from "react";

type ServiceProcessItem = {
  step?: string;
  title?: string;
  subtitle?: string;
  description?: string;
};

type ServiceProcessProps = {
  backgroundColor?: string;
  heading?: string;
  subheading?: string;
  circleColor?: string;
  lineColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  descriptionColor?: string;
  items?: ServiceProcessItem[];
};

const safeText = (value?: string) => (value ? String(value) : "");

export default function ServiceProcess({
  backgroundColor,
  heading,
  subheading,
  circleColor,
  lineColor,
  titleColor,
  subtitleColor,
  descriptionColor,
  items = [],
}: ServiceProcessProps) {
  const backgroundStyle = safeText(backgroundColor)
    ? { backgroundColor: safeText(backgroundColor) }
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
        <div className="relative grid gap-8 md:grid-cols-4">
          <div
            className="absolute left-0 right-0 top-6 hidden h-px md:block"
            style={{ backgroundColor: safeText(lineColor) || "#cbd5f5" }}
          />
          {items.map((item, index) => (
            <div
              key={`${item.step}-${index}`}
              className="relative z-10 flex flex-col items-center gap-3 text-center"
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold text-white shadow-lg"
                style={{
                  backgroundColor: safeText(circleColor) || "var(--brand-blue)",
                }}
              >
                {safeText(item.step)}
              </div>
              <div
                className="text-sm font-semibold"
                style={{ color: safeText(titleColor) || "var(--brand-navy)" }}
              >
                {safeText(item.title)}
              </div>
              <div
                className="text-xs"
                style={{ color: safeText(subtitleColor) || "var(--brand-blue)" }}
              >
                {safeText(item.subtitle)}
              </div>
              {item.description && (
                <div
                  className="text-xs"
                  style={{ color: safeText(descriptionColor) || "#475569" }}
                >
                  {safeText(item.description)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
