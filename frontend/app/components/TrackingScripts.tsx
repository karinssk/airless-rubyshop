"use client";

import { useEffect, useState, useCallback } from "react";
import Script from "next/script";
import GoogleAnalytics from "./GoogleAnalytics";
import { backendBaseUrl } from "@/lib/urls";

const GTM_ID = "GTM-N6CNLKHW";
const META_PIXEL_ID = "1559144322039457";
const FB_PAGE_ID = "816184855086392";

export default function TrackingScripts() {
  const [enabled, setEnabled] = useState(false);
  const isProd = process.env.NODE_ENV === "production";
  const gaEnabled = isProd; // Temporarily load GA without consent

  useEffect(() => {
    if (!isProd) return;

    const consent = localStorage.getItem("cookieConsent");
    if (consent === "accepted") {
      setEnabled(true);
    }

    const handleConsent = () => setEnabled(true);
    window.addEventListener("cookieConsentAccepted", handleConsent);
    return () => window.removeEventListener("cookieConsentAccepted", handleConsent);
  }, [isProd]);

  const trackMessengerClick = useCallback(() => {
    if (!backendBaseUrl) return;
    fetch(`${backendBaseUrl}/stats/messenger-click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referrer: window.location.href }),
    }).catch(() => {});
  }, []);

  return (
    <>
      {/* Floating Messenger Button */}
      <a
        href={`https://m.me/${FB_PAGE_ID}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on Messenger"
        onClick={trackMessengerClick}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          backgroundColor: "#0084FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          cursor: "pointer",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.25)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18 3C9.716 3 3 9.216 3 16.95c0 4.394 2.16 8.312 5.534 10.878V33l4.91-2.697A16.19 16.19 0 0018 30.9c8.284 0 15-6.216 15-13.95S26.284 3 18 3z"
            fill="#fff"
          />
          <path
            d="M8.727 21.273L14.182 14l5.09 4.636L24.546 14l-5.455 7.273-5.09-4.636-5.274 4.636z"
            fill="#0084FF"
          />
        </svg>
      </a>

      {enabled && (
        <>
          {/* Google Tag Manager */}
          <Script
            id="gtm-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
            }}
          />
          {/* End Google Tag Manager */}

          {/* Meta Pixel Code */}
          <Script
            id="meta-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`,
            }}
          />
          {/* End Meta Pixel Code */}
        </>
      )}

      {gaEnabled && <GoogleAnalytics />}
    </>
  );
}
