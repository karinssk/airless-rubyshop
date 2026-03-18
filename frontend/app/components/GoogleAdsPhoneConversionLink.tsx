"use client";

import type { ReactNode } from "react";

const ADS_SEND_TO = process.env.NEXT_PUBLIC_ADS_PHONE_CONVERSION_SEND_TO || "AW-1065750118/qgqqCNfz5v8bEOacmPwD";

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
};

type GtagWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

export default function GoogleAdsPhoneConversionLink({
  href,
  className,
  children,
}: Props) {
  const handleClick = () => {
    if (!ADS_SEND_TO) return;
    const w = window as GtagWindow;
    w.dataLayer = w.dataLayer || [];
    w.gtag =
      w.gtag ||
      ((...args: unknown[]) => {
        w.dataLayer?.push(args);
      });
    w.gtag("event", "conversion", { send_to: ADS_SEND_TO, value: 120.0, currency: "THB" });
  };

  return (
    <a
      href={href}
      className={className}
      onClick={handleClick}
      data-track-click-source="phone-link"
      data-track-click-label="phone-link"
      data-track-click-target={href}
    >
      {children}
    </a>
  );
}
