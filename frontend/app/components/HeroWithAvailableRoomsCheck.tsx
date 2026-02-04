"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { resolveUploadUrl } from "@/lib/urls";

type HeroWithAvailablebookingCheckProps = {
  title?: string;
  subtitle?: string;
  description?: string;
  backgroundImage?: string;
  overlayTitle?: string;
  overlayButtonText?: string;
  titleColor?: string;
  subtitleColor?: string;
  descriptionColor?: string;
  buttonBackground?: string;
  buttonTextColor?: string;
};

const toDateInput = (value: Date) => value.toISOString().split("T")[0];

export default function HeroWithAvailablebookingCheck({
  title,
  subtitle,
  description,
  backgroundImage,
  overlayTitle,
  overlayButtonText,
  titleColor,
  subtitleColor,
  descriptionColor,
  buttonBackground,
  buttonTextColor,
}: HeroWithAvailablebookingCheckProps) {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || "en";
  const today = useMemo(() => new Date(), []);
  const tomorrow = useMemo(() => {
    const next = new Date();
    next.setDate(next.getDate() + 1);
    return next;
  }, []);
  const [checkIn, setCheckIn] = useState(toDateInput(today));
  const [checkOut, setCheckOut] = useState(toDateInput(tomorrow));

  const handleSearch = () => {
    const query = new URLSearchParams({ checkIn, checkOut }).toString();
    router.push(`/${locale}/rooms?${query}`);
  };

  const backgroundStyle = backgroundImage
    ? { backgroundImage: `url(${resolveUploadUrl(backgroundImage)})` }
    : undefined;

  return (
    <section className="relative overflow-hidden bg-slate-900 text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={backgroundStyle}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/80" />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/90">
            {subtitle || "Availability"}
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
            {title || "Find your next stay"}
          </h1>
          <p className="max-w-xl text-base text-white/80 md:text-lg">
            {description ||
              "Search daily or monthly booking and get real-time availability."}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 text-slate-900 shadow-2xl shadow-slate-900/30">
          <div className="text-sm font-semibold text-slate-800">
            {overlayTitle || "Check available booking"}
          </div>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1 text-xs font-medium text-slate-500">
              Check-in
              <input
                type="date"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={checkIn}
                onChange={(event) => setCheckIn(event.target.value)}
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-slate-500">
              Check-out
              <input
                type="date"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={checkOut}
                onChange={(event) => setCheckOut(event.target.value)}
              />
            </label>
            <button
              onClick={handleSearch}
              className="mt-2 w-full rounded-xl px-4 py-3 text-sm font-semibold transition hover:brightness-95"
              style={{
                backgroundColor: buttonBackground || "#2563eb",
                color: buttonTextColor || "#ffffff",
              }}
            >
              {overlayButtonText || "Search availability"}
            </button>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            Results open at /{locale}/rooms with your dates.
          </div>
        </div>
      </div>
    </section>
  );
}
