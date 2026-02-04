"use client";

import { useState, useRef } from "react";
import { backendBaseUrl } from "@/lib/urls";

const API_URL = backendBaseUrl;

type MultipleImageUploadProps = {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  helperText?: string;
  maxImages?: number;
};

export default function MultipleImageUpload({
  value = [],
  onChange,
  label = "Images",
  helperText = "Upload multiple images (max 5MB each)",
  maxImages = 10,
}: MultipleImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check max images limit
    if (images.length + files.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate files
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        alert("Please select only image files");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is larger than 5MB`);
        return;
      }
    }

    setUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${API_URL}/uploads`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");

        const data = await res.json();
        return data.path;
      });

      const uploadedPaths = await Promise.all(uploadPromises);
      const newImages = [...images, ...uploadedPaths];
      setImages(newImages);
      onChange(newImages);

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload one or more images. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onChange(newImages);
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [removed] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, removed);
    setImages(newImages);
    onChange(newImages);
  };

  const getImageUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    return `${API_URL}${path}`;
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="space-y-4">
        {/* Image Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {images.map((imagePath, index) => (
              <div key={index} className="group relative">
                <img
                  src={getImageUrl(imagePath)}
                  alt={`Image ${index + 1}`}
                  className="h-32 w-full rounded-lg border border-slate-200 object-cover"
                />

                {/* Image number badge */}
                <div className="absolute left-2 top-2 rounded-full bg-slate-900/70 px-2 py-1 text-xs font-semibold text-white">
                  {index + 1}
                </div>

                {/* Action buttons */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-slate-900/0 opacity-0 transition-all group-hover:bg-slate-900/50 group-hover:opacity-100">
                  {/* Move left */}
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => handleReorder(index, index - 1)}
                      className="rounded-full bg-white p-2 text-slate-700 shadow-lg hover:bg-slate-100"
                      title="Move left"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="rounded-full bg-red-600 p-2 text-white shadow-lg hover:bg-red-700"
                    title="Remove"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Move right */}
                  {index < images.length - 1 && (
                    <button
                      type="button"
                      onClick={() => handleReorder(index, index + 1)}
                      className="rounded-full bg-white p-2 text-slate-700 shadow-lg hover:bg-slate-100"
                      title="Move right"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {images.length < maxImages && (
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-6 text-sm font-semibold text-slate-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
            >
              {uploading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="h-5 w-5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Uploading...
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <svg
                    className="h-8 w-8"
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
                  <span>
                    {images.length === 0
                      ? "Click to upload images"
                      : `Add more images (${images.length}/${maxImages})`}
                  </span>
                </div>
              )}
            </button>
          </div>
        )}

        {/* Helper Text */}
        {helperText && (
          <p className="text-xs text-slate-500">
            {helperText} • {images.length}/{maxImages} images
          </p>
        )}
      </div>
    </div>
  );
}
