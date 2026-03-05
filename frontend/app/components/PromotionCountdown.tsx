"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  message?: string;
  ctaText?: string;
  ctaHref?: string;
  endAfterDays?: number | string;
  endAfterHours?: number | string;
  endAfterMinutes?: number | string;
  backgroundColor?: string;
  textColor?: string;
  timerBoxColor?: string;
  timerTextColor?: string;
  ctaBgColor?: string;
  ctaTextColor?: string;
  dayLabel?: string;
};

const toText = (value?: unknown) => (value ? String(value) : "");
const toNonNegative = (value?: unknown) => Math.max(0, Number(value) || 0);

export default function PromotionCountdown(props: Props) {
  const durationMs = useMemo(() => {
    const days = toNonNegative(props.endAfterDays);
    const hours = toNonNegative(props.endAfterHours);
    const minutes = toNonNegative(props.endAfterMinutes);
    return (days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60) * 1000;
  }, [props.endAfterDays, props.endAfterHours, props.endAfterMinutes]);

  const [startTs] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const totalSeconds = Math.max(0, Math.floor((startTs + durationMs - now) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const sectionBg = toText(props.backgroundColor) || "#b91c1c";
  const textColor = toText(props.textColor) || "#ffffff";
  const timerBg = toText(props.timerBoxColor) || "#ffffff";
  const timerText = toText(props.timerTextColor) || "#b91c1c";
  const ctaBg = toText(props.ctaBgColor) || "#ffffff";
  const ctaText = toText(props.ctaTextColor) || "#b91c1c";
  const dayLabel = toText(props.dayLabel) || "วัน";

  const cellClass =
    "inline-flex min-w-9 items-center justify-center rounded-md px-2 py-1 text-lg font-extrabold tabular-nums sm:min-w-10 sm:text-xl";

  return (
    <section className="py-2.5" style={{ backgroundColor: sectionBg }}>
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p
          className="flex items-start gap-2 text-sm font-bold leading-tight sm:items-center"
          style={{ color: textColor }}
        >
          <span className="text-base">🔥</span>
          <span className="whitespace-pre-line">{toText(props.message)}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div className="flex items-center gap-1.5">
            <span className={cellClass} style={{ backgroundColor: timerBg, color: timerText }}>
              {String(days).padStart(2, "0")}
            </span>
            <span className="text-xs font-semibold" style={{ color: textColor }}>
              {dayLabel}
            </span>
            <span className={cellClass} style={{ backgroundColor: timerBg, color: timerText }}>
              {String(hours).padStart(2, "0")}
            </span>
            <span className="text-lg font-extrabold sm:text-xl" style={{ color: textColor }}>
              :
            </span>
            <span className={cellClass} style={{ backgroundColor: timerBg, color: timerText }}>
              {String(minutes).padStart(2, "0")}
            </span>
            <span className="text-lg font-extrabold sm:text-xl" style={{ color: textColor }}>
              :
            </span>
            <span className={cellClass} style={{ backgroundColor: timerBg, color: timerText }}>
              {String(seconds).padStart(2, "0")}
            </span>
          </div>
          <a
            href={toText(props.ctaHref) || "#"}
            className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold shadow-sm"
            style={{ backgroundColor: ctaBg, color: ctaText }}
          >
            {toText(props.ctaText)}
            <span className="ml-2">→</span>
          </a>
        </div>
        </div>
      </div>
    </section>
  );
}
