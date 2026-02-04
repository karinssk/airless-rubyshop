"use client";

import { useEffect, useState } from "react";
import { Link } from "@/lib/navigation";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const cookieConsent = localStorage.getItem("cookieConsent");
    if (!cookieConsent) {
      // Small delay to prevent flash on page load
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9998] bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row sm:gap-6 sm:px-6 sm:py-5">
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm text-gray-700 sm:text-base">
            We use cookies to enhance your browsing experience and analyze our traffic.
            By clicking &quot;Accept&quot;, you consent to our use of cookies.{" "}
            <Link
              href="/privacy-policy"
              className="text-red-600 underline hover:text-red-800"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={handleAccept}
            className="rounded-full bg-black px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-gray-800 sm:px-10"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
