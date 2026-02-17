"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import GoogleAnalytics from "./GoogleAnalytics";

const GTM_ID = "GTM-N6CNLKHW";
const META_PIXEL_ID = "1559144322039457";
const FB_PAGE_ID = "816184855086392";
const FB_MESSENGER_LOCALE = "th_TH";

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

  return (
    <>
      <div id="fb-root"></div>
      <div id="fb-customer-chat" className="fb-customerchat"></div>
      <Script
        id="fb-messenger-sdk"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `var chatbox = document.getElementById('fb-customer-chat');
chatbox.setAttribute('page_id', '${FB_PAGE_ID}');
chatbox.setAttribute('attribution', 'biz_inbox');

window.fbAsyncInit = function() {
  FB.init({
    xfbml            : true,
    version          : 'v18.0'
  });
  console.log('[Messenger] FB SDK initialized');
};

(function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id;
  js.src = 'https://connect.facebook.net/${FB_MESSENGER_LOCALE}/sdk/xfbml.customerchat.js';
  js.onload = function() {
    console.log('[Messenger] SDK script loaded');
  };
  js.onerror = function() {
    console.log('[Messenger] SDK script failed to load');
  };
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));`,
        }}
      />

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
