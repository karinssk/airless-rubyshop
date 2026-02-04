"use client";

import { useEffect, useState } from "react";
import { backendBaseUrl, resolveUploadUrl } from "@/lib/urls";
import { getAdminAuthHeaders } from "@/lib/auth";

type PopupSetting = {
  enabled: boolean;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
};

export default function PopupImagePage() {
  const [setting, setSetting] = useState<PopupSetting>({
    enabled: false,
    imageUrl: "",
    buttonText: "Click to see promotion",
    buttonLink: "",
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSetting = async () => {
    try {
      const response = await fetch(`${backendBaseUrl}/popup-image`, {
        headers: getAdminAuthHeaders(),
      });
      const data = await response.json();
      if (data.setting) {
        setSetting({
          enabled: data.setting.enabled || false,
          imageUrl: data.setting.imageUrl || "",
          buttonText: data.setting.buttonText || "Click to see promotion",
          buttonLink: data.setting.buttonLink || "",
        });
      }
    } catch (error) {
      console.error("Failed to load popup setting:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSetting();
  }, []);

  const saveSetting = async () => {
    try {
      const response = await fetch(`${backendBaseUrl}/popup-image`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify(setting),
      });
      if (response.ok) {
        setMessage("Saved successfully!");
        setTimeout(() => setMessage(null), 2000);
      } else {
        setMessage("Failed to save");
        setTimeout(() => setMessage(null), 2000);
      }
    } catch (error) {
      console.error("Failed to save popup setting:", error);
      setMessage("Failed to save");
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${backendBaseUrl}/uploads`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (response.ok && data.path) {
        setSetting((prev) => ({ ...prev, imageUrl: data.path }));
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setSetting((prev) => ({ ...prev, imageUrl: "" }));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Popup Image
          </h2>
          <p className="text-xs text-slate-400">
            Configure the popup image that appears when visitors first visit the homepage.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={saveSetting}
            className="rounded-full bg-emerald-600 px-4 py-2 text-xs text-white hover:bg-emerald-700"
            disabled={loading}
          >
            Save
          </button>
          {message && (
            <span className={`text-xs ${message.includes("Failed") ? "text-red-600" : "text-emerald-600"}`}>
              {message}
            </span>
          )}
        </div>
      </header>

      <div className="mt-6 space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <label className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">Enable Popup</p>
              <p className="text-xs text-slate-500">
                Show the popup when visitors first visit the homepage.
              </p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={setting.enabled}
                onChange={(e) =>
                  setSetting((prev) => ({ ...prev, enabled: e.target.checked }))
                }
                className="peer sr-only"
              />
              <div
                onClick={() =>
                  setSetting((prev) => ({ ...prev, enabled: !prev.enabled }))
                }
                className={`h-6 w-11 cursor-pointer rounded-full transition-colors ${
                  setting.enabled ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <div
                  className={`h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                    setting.enabled ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </div>
            </div>
          </label>
        </div>

        {/* Image Upload */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-700">Popup Image</p>
          <p className="mt-1 text-xs text-slate-500">
            Upload a large promotional image to display in the popup.
          </p>

          <div className="mt-4 flex items-start gap-4">
            {setting.imageUrl && (
              <div className="relative">
                <img
                  src={resolveUploadUrl(setting.imageUrl)}
                  alt="Popup preview"
                  className="h-48 w-auto max-w-xs rounded-lg border border-slate-200 object-contain bg-white"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white px-8 py-8 hover:border-blue-400">
              <svg
                className="h-10 w-10 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="mt-2 text-sm text-slate-500">
                {uploading ? "Uploading..." : "Upload Image"}
              </span>
              <span className="mt-1 text-xs text-slate-400">
                Recommended: 800x600px or larger
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {/* Button Text */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <label className="block">
            <p className="text-sm font-semibold text-slate-700">Button Text</p>
            <p className="mt-1 text-xs text-slate-500">
              Text displayed on the button at the bottom of the popup.
            </p>
            <input
              type="text"
              value={setting.buttonText}
              onChange={(e) =>
                setSetting((prev) => ({ ...prev, buttonText: e.target.value }))
              }
              placeholder="Click to see promotion"
              className="mt-3 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </label>
        </div>

        {/* Button Link */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <label className="block">
            <p className="text-sm font-semibold text-slate-700">Button Link</p>
            <p className="mt-1 text-xs text-slate-500">
              URL to open when the button is clicked. Leave empty to just close the popup.
            </p>
            <input
              type="url"
              value={setting.buttonLink}
              onChange={(e) =>
                setSetting((prev) => ({ ...prev, buttonLink: e.target.value }))
              }
              placeholder="https://example.com/promotion"
              className="mt-3 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </label>
        </div>

        {/* Preview Section */}
        {setting.imageUrl && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-700">Preview</p>
            <p className="mt-1 text-xs text-slate-500">
              This is how the popup will appear to visitors.
            </p>
            <div className="mt-4 flex justify-center">
              <div className="relative max-w-md rounded-2xl bg-white shadow-2xl">
                {/* Mock close button */}
                <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow">
                  <svg
                    className="h-4 w-4 text-gray-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <img
                  src={resolveUploadUrl(setting.imageUrl)}
                  alt="Preview"
                  className="max-h-64 w-full rounded-t-2xl object-contain"
                />
                {setting.buttonText && (
                  <div className="rounded-b-2xl bg-white px-4 py-3 text-center">
                    <span className="inline-block rounded-full bg-blue-600 px-6 py-2 text-xs font-semibold text-white">
                      {setting.buttonText}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
