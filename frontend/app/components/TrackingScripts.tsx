"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import GoogleAnalytics from "./GoogleAnalytics";

const GTM_ID = "GTM-N6CNLKHW";
const META_PIXEL_ID = "1559144322039457";

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

  if (!enabled && !gaEnabled) return null;

  return (
    <>
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
