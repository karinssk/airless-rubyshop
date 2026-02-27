"use client";

import type { ReactNode } from "react";

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
  const handleClick = () => {
    const w = window as any;
    w.dataLayer = w.dataLayer || [];
    w.gtag = w.gtag || function () { w.dataLayer.push(arguments); };
    const payload: Record<string, any> = { send_to: sendTo };
    if (value !== undefined) payload.value = value;
    if (currency) payload.currency = currency;
    w.gtag("event", "conversion", payload);
  };

  return (
    <a href={href} className={className} target={target} rel={rel} onClick={handleClick}>
      {children}
    </a>
  );
}
