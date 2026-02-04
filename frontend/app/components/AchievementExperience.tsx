"use client";

import { useEffect, useState } from "react";
import { resolveUploadUrl } from "@/lib/urls";

type AchievementItem = {
  value?: string;
  label?: string;
  sublabel?: string;
  icon?: string;
};

type AchievementExperienceProps = {
  backgroundColor?: string;
  items?: AchievementItem[];
};

const safeText = (value?: string) => (value ? String(value) : "");
const resolveImage = (value?: string) => resolveUploadUrl(safeText(value));

export default function AchievementExperience({
  backgroundColor,
  items = [],
}: AchievementExperienceProps) {
  const backgroundStyle = safeText(backgroundColor)
    ? { backgroundColor: safeText(backgroundColor) }
    : undefined;

  return (
    <section className="py-10 text-white" style={backgroundStyle}>
      <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-4">
        {items.map((item, index) => (
          <AchievementMetric key={`${item.value}-${index}`} item={item} />
        ))}
      </div>
    </section>
  );
}

function AchievementMetric({ item }: { item: AchievementItem }) {
  const { value, suffix } = parseCountValue(safeText(item.value));
  const count = useCountUp(value);
  const displaySuffix = suffix
    ? suffix.startsWith("/")
      ? suffix
      : ` ${suffix}`
    : "";

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {item.icon && (
        <img src={resolveImage(item.icon)} alt="" className="h-8 w-8" />
      )}
      <div className="text-3xl font-semibold text-white">
        {count.toLocaleString()}
        {displaySuffix}
      </div>
      <div className="text-sm font-semibold text-white">
        {safeText(item.label)}
      </div>
      <div className="text-xs text-slate-200">
        {safeText(item.sublabel)}
      </div>
    </div>
  );
}

function parseCountValue(value: string) {
  const match = value.match(/[\d,]+(?:\.\d+)?/);
  if (!match) {
    return { value: 0, suffix: value };
  }
  const numberValue = Number(match[0].replace(/,/g, ""));
  const suffix = value.replace(match[0], "").trim();
  return { value: Number.isFinite(numberValue) ? numberValue : 0, suffix };
}

function useCountUp(target: number) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(target) || target <= 0) {
      setCount(0);
      return;
    }
    let start: number | null = null;
    const duration = 1200;
    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setCount(Math.round(target * progress));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [target]);

  return count;
}
