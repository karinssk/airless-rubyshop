"use client";

import type { ReactNode } from "react";
import { inferTrackingSourceFromHref } from "@/lib/userTracking";

type Props = {
  href: string;
  sendTo: string;
  value?: number;
  currency?: string;
  className?: string;
  children: ReactNode;
  target?: string;
  rel?: string;
};

type GtagWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

export default function GoogleAdsConversionLink({
  href,
  sendTo,
  value,
  currency = "THB",
  className,
  children,
  target,
  rel,
}: Props) {
  const trackingSource = inferTrackingSourceFromHref(href);

  const handleClick = () => {
    const w = window as GtagWindow;
    w.dataLayer = w.dataLayer || [];
    w.gtag =
      w.gtag ||
      ((...args: unknown[]) => {
        w.dataLayer?.push(args);
      });
    const payload: Record<string, string | number> = { send_to: sendTo };
    if (value !== undefined) payload.value = value;
    if (currency) payload.currency = currency;
    w.gtag("event", "conversion", payload);
  };

  return (
    <a
      href={href}
      className={className}
      target={target}
      rel={rel}
      onClick={handleClick}
      data-track-click-source={trackingSource || undefined}
      data-track-click-label={trackingSource || undefined}
      data-track-click-target={trackingSource ? href : undefined}
    >
      {children}
    </a>
  );
}
