"use client";

import Script from "next/script";

export default function DeferredChatWidget() {
  const tawkEnabled = process.env.NEXT_PUBLIC_TAWK_ENABLED === "true";
  if (!tawkEnabled) return null;

  return (
    <Script
      id="tawk-to"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{
        __html: `
          var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
          (function(){
            var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
            s1.async=true;
            s1.src='https://embed.tawk.to/67ee6174ae5da2190a19f5ef/1intipbq1';
            s1.charset='UTF-8';
            s1.setAttribute('crossorigin','*');
            s0.parentNode.insertBefore(s1,s0);
          })();
        `,
      }}
    />
  );
}
