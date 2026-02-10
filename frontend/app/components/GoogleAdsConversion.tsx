"use client";

import { useEffect } from "react";

const ADS_SEND_TO = "AW-1065750118/cXiACJXcw4wDEOacmPwD";

export default function GoogleAdsConversion() {
  useEffect(() => {
    const w = window as any;
    w.dataLayer = w.dataLayer || [];
    w.gtag = w.gtag || function () {
      w.dataLayer.push(arguments);
    };
    w.gtag("event", "conversion", { send_to: ADS_SEND_TO });
  }, []);

  return null;
}
