"use client";

import { useEffect } from "react";
import Script from "next/script";

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-0PWGSWH0P4";
const GA_DEBUG = process.env.NEXT_PUBLIC_GA_DEBUG === "true";

export default function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  useEffect(() => {
    if (!GA_DEBUG) return;
    // Debug-only log to verify GA tag injection on client.
    // eslint-disable-next-line no-console
    console.log("[GA] Loaded", { id: GA_MEASUREMENT_ID });
  }, []);

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}
