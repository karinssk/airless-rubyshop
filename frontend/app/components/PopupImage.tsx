"use client";

import { useEffect, useState } from "react";
import { backendBaseUrl, resolveUploadUrl } from "@/lib/urls";

type PopupSetting = {
  enabled: boolean;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
};

export default function PopupImage() {
  const [setting, setSetting] = useState<PopupSetting | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const fetchPopupSetting = async () => {
      try {
        const response = await fetch(`${backendBaseUrl}/popup-image`);
        if (!response.ok) return;
        const data = await response.json();
        if (data.setting && data.setting.enabled && data.setting.imageUrl) {
          setSetting(data.setting);
          // Check if popup was already shown in this session
          const popupShown = sessionStorage.getItem("popupImageShown");
          if (!popupShown) {
            setIsOpen(true);
            sessionStorage.setItem("popupImageShown", "true");
          }
        }
      } catch (error) {
        console.error("Failed to fetch popup setting:", error);
      }
    };

    fetchPopupSetting();
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleButtonClick = () => {
    if (setting?.buttonLink) {
      window.open(setting.buttonLink, "_blank", "noopener,noreferrer");
    }
    setIsOpen(false);
  };

  if (!isOpen || !setting) return null;

  const imageUrl = resolveUploadUrl(setting.imageUrl);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
      onClick={handleClose}
    >
      <div
        className="relative max-h-[95vh] w-[95vw] md:w-[85vw] lg:w-[75vw] xl:w-[65vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute -right-2 -top-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg transition-transform hover:scale-110 md:-right-4 md:-top-4 md:h-14 md:w-14"
          aria-label="Close popup"
        >
          <svg
            className="h-7 w-7 text-gray-700 md:h-8 md:w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Image container */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          {!imageLoaded && (
            <div className="flex h-96 w-full items-center justify-center bg-gray-100">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-red-600"></div>
            </div>
          )}
          <img
            src={imageUrl}
            alt="Promotion"
            className={`max-h-[80vh] w-full object-contain ${imageLoaded ? "block" : "hidden"}`}
            onLoad={() => setImageLoaded(true)}
          />

          {/* Button at bottom center */}
          {setting.buttonText && (
            <div className="bg-white px-6 py-5 text-center md:py-6">
              <button
                onClick={handleButtonClick}
                className="inline-block rounded-full bg-black px-10 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-gray-800 hover:shadow-xl md:px-12 md:py-4 md:text-lg"
              >
                {setting.buttonText}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
