import React from "react";
import { resolveUploadUrl } from "@/lib/urls";

type ReadyForServiceProps = {
  backgroundColor?: string;
  heading?: string;
  description?: string;
  primaryCtaText?: string;
  primaryCtaHref?: string;
  primaryIcon?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  secondaryIcon?: string;
  primaryCtaBackground?: string;
  primaryCtaTextColor?: string;
  secondaryCtaBackground?: string;
  secondaryCtaTextColor?: string;
  iconColor?: string;
};

const safeText = (value?: string) => (value ? String(value) : "");
const resolveImage = (value?: string) => resolveUploadUrl(safeText(value));

export default function ReadyForService({
  backgroundColor,
  heading,
  description,
  primaryCtaText,
  primaryCtaHref,
  primaryIcon,
  secondaryCtaText,
  secondaryCtaHref,
  secondaryIcon,
  primaryCtaBackground,
  primaryCtaTextColor,
  secondaryCtaBackground,
  secondaryCtaTextColor,
  iconColor,
}: ReadyForServiceProps) {
  const backgroundValue = safeText(backgroundColor);
  const backgroundStyle = backgroundValue ? { backgroundColor: backgroundValue } : undefined;
  const bg = backgroundValue.toLowerCase();
  const isLight =
    !bg || bg === "#fff" || bg === "#ffffff" || bg === "white";
  const normalizeColor = (value: string) => value.trim().toLowerCase();
  let primaryBg =
    safeText(primaryCtaBackground) || (isLight ? "#000000" : "var(--brand-yellow)");
  let primaryText =
    safeText(primaryCtaTextColor) || (isLight ? "#ffffff" : "var(--brand-navy)");
  if (normalizeColor(primaryBg) === normalizeColor(primaryText)) {
    primaryText = "#ffffff";
  }
  const secondaryBg =
    safeText(secondaryCtaBackground) || (isLight ? "#ffffff" : "transparent");
  const secondaryText =
    safeText(secondaryCtaTextColor) || (isLight ? "#334155" : "#ffffff");
  const headingClass = isLight ? "text-slate-900" : "text-white";
  const descriptionClass = isLight ? "text-slate-600" : "text-white/80";
  const secondaryBorderClass = isLight ? "border-slate-300" : "border-white/30";
  const iconBgClass = isLight ? "bg-slate-100" : "bg-white/20";
  const iconTint = safeText(iconColor) || (isLight ? "#0f172a" : "currentColor");

  return (
    <section
      className={`py-12 ${isLight ? "text-slate-900" : "text-white"}`}
      style={backgroundStyle}
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 text-center">
        <h2 className={`text-3xl font-semibold ${headingClass}`}>
          {safeText(heading)}
        </h2>
        <p className={`text-sm ${descriptionClass}`}>{safeText(description)}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href={safeText(primaryCtaHref) || "#"}
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-lg"
            style={{
              backgroundColor: primaryBg,
              color: primaryText,
            }}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full ${iconBgClass}`}
              style={{ color: iconTint }}
            >
              {primaryIcon ? (
                <img
                  src={resolveImage(primaryIcon)}
                  alt=""
                  className="h-4 w-4 object-contain"
                />
              ) : (
                "📄"
              )}
            </span>
            {safeText(primaryCtaText)}
          </a>
          <a
            href={safeText(secondaryCtaHref) || "#"}
            className={`inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold ${secondaryBorderClass}`}
            style={{
              backgroundColor: secondaryBg,
              color: secondaryText,
            }}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full ${iconBgClass}`}
              style={{ color: iconTint }}
            >
              {secondaryIcon ? (
                <img
                  src={resolveImage(secondaryIcon)}
                  alt=""
                  className="h-4 w-4 object-contain"
                />
              ) : (
                "📞"
              )}
            </span>
            {safeText(secondaryCtaText)}
          </a>
        </div>
      </div>
    </section>
  );
}
