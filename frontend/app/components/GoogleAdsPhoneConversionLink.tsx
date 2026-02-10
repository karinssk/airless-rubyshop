"use client";

import type { ReactNode, MouseEvent } from "react";

const ADS_SEND_TO = process.env.NEXT_PUBLIC_ADS_PHONE_CONVERSION_SEND_TO || "AW-10932591325/0n9CIPGQkL8YEOyKj5so";

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
};

export default function GoogleAdsPhoneConversionLink({
  href,
  className,
  children,
}: Props) {
  const handleClick = (_event: MouseEvent<HTMLAnchorElement>) => {
    if (!ADS_SEND_TO) return;
    const w = window as any;
    w.dataLayer = w.dataLayer || [];
    w.gtag =
      w.gtag ||
      function () {
        w.dataLayer.push(arguments);
      };
    w.gtag("event", "conversion", { send_to: ADS_SEND_TO });
  };

  return (
    <a href={href} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
