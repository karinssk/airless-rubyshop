"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import GoogleAnalytics from "./GoogleAnalytics";
import { backendBaseUrl } from "@/lib/urls";
import {
  inferTrackingSourceFromHref,
  initUserTracking,
  isExitTargetHref,
  trackUserInteraction,
} from "@/lib/userTracking";

const META_PIXEL_ID = "1559144322039457";
const FB_PAGE_ID = "816184855086392";

const collectJsSignals = () => {
  if (typeof window === "undefined") return {};
  const nav = window.navigator;
  const screenRef = window.screen;

  return {
    webdriver: Boolean(nav.webdriver),
    platform: nav.platform || "",
    language: nav.language || "",
    languages: Array.isArray(nav.languages) ? nav.languages : [],
    pluginsLength: nav.plugins?.length || 0,
    mimeTypesLength: nav.mimeTypes?.length || 0,
    hardwareConcurrency: nav.hardwareConcurrency || 0,
    deviceMemory: (nav as Navigator & { deviceMemory?: number }).deviceMemory || 0,
    maxTouchPoints: nav.maxTouchPoints || 0,
    screenWidth: screenRef?.width || 0,
    screenHeight: screenRef?.height || 0,
    viewportWidth: window.innerWidth || 0,
    viewportHeight: window.innerHeight || 0,
    pixelRatio: window.devicePixelRatio || 1,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    timezoneOffset: new Date().getTimezoneOffset(),
    hasChromeObject: Boolean((window as Window & { chrome?: unknown }).chrome),
    hasPlaywright: Boolean((window as Window & { __playwright__binding__?: unknown }).__playwright__binding__),
    hasPuppeteer: Boolean((window as Window & { __puppeteer_evaluation_script__?: unknown }).__puppeteer_evaluation_script__),
    hasSelenium: Boolean(
      (window as Window & { _selenium?: unknown; __selenium_unwrapped?: unknown; __webdriver_script_fn?: unknown })._selenium ||
      (window as Window & { _selenium?: unknown; __selenium_unwrapped?: unknown; __webdriver_script_fn?: unknown }).__selenium_unwrapped ||
      (window as Window & { _selenium?: unknown; __selenium_unwrapped?: unknown; __webdriver_script_fn?: unknown }).__webdriver_script_fn
    ),
    hasPhantom: Boolean((window as Window & { _phantom?: unknown; callPhantom?: unknown })._phantom || (window as Window & { _phantom?: unknown; callPhantom?: unknown }).callPhantom),
    doNotTrack: nav.doNotTrack || "",
    cookieEnabled: Boolean(nav.cookieEnabled),
    touchSupport: "ontouchstart" in window || (nav.maxTouchPoints || 0) > 0,
    colorDepth: screenRef?.colorDepth || 0,
  };
};

export default function TrackingScripts() {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    if (process.env.NODE_ENV !== "production") return false;
    return localStorage.getItem("cookieConsent") === "accepted";
  });
  const isProd = process.env.NODE_ENV === "production";
  const gaEnabled = isProd; // Temporarily load GA without consent

  useEffect(() => {
    if (!isProd) return;

    const handleConsent = () => setEnabled(true);
    window.addEventListener("cookieConsentAccepted", handleConsent);
    return () => window.removeEventListener("cookieConsentAccepted", handleConsent);
  }, [isProd]);

  useEffect(() => {
    if (!backendBaseUrl) return;
    initUserTracking({
      backendUrl: backendBaseUrl,
      collectJsSignals,
    });
  }, []);

  useEffect(() => {
    const handleTrackedClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      let source = "";
      let label = "";
      let targetHref = "";

      const trackedElement = target.closest<HTMLElement>("[data-track-click-source]");
      if (trackedElement) {
        source = trackedElement.dataset.trackClickSource?.trim() || "";
        label = trackedElement.dataset.trackClickLabel?.trim() || "";
        const explicitHref = trackedElement.dataset.trackClickTarget?.trim() || "";
        const anchorHref =
          trackedElement instanceof HTMLAnchorElement
            ? trackedElement.href || ""
            : "";
        targetHref = explicitHref || anchorHref;
      } else {
        const clickedAnchor = target.closest<HTMLAnchorElement>("a[href]");
        if (!clickedAnchor) return;
        const anchorHref = clickedAnchor.href || clickedAnchor.getAttribute("href") || "";
        source = inferTrackingSourceFromHref(anchorHref);
        if (!source) return;
        label =
          clickedAnchor.getAttribute("aria-label") ||
          clickedAnchor.textContent?.trim() ||
          source;
        targetHref = anchorHref;
      }

      if (!source) return;

      const finalizeSession = isExitTargetHref(targetHref);
      trackUserInteraction({
        source,
        label,
        targetHref,
        endReason: finalizeSession ? `${source}-click` : "",
        finalizeSession,
      });
    };

    document.addEventListener("click", handleTrackedClick);
    return () => document.removeEventListener("click", handleTrackedClick);
  }, []);

  return (
    <>
      {/* Floating Messenger Button */}
      <a
        href={`https://m.me/${FB_PAGE_ID}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on Messenger"
        data-track-click-source="messenger-floating-button"
        data-track-click-label="floating-messenger"
        data-track-click-target={`https://m.me/${FB_PAGE_ID}`}
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
