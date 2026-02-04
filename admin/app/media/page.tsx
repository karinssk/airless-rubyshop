"use client";

import { useEffect, useState } from "react";
import { backendBaseUrl } from "@/lib/urls";

const API_URL = backendBaseUrl;

type MediaItem = {
  filename: string;
  url: string;
  thumbUrl?: string | null;
  size: number;
  updatedAt: string;
};

const formatSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

export default function MediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const loadItems = async () => {
    setLoading(true);
    const response = await fetch(`${API_URL}/uploads/list`);
    const data = await response.json();
    setItems(data.files || []);
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_URL}/uploads`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      setMessage("Upload failed");
      return;
    }
    setMessage("Uploaded");
    await loadItems();
    setTimeout(() => setMessage(null), 1500);
  };

  const deleteImage = async (filename: string) => {
    await fetch(`${API_URL}/uploads/${filename}`, { method: "DELETE" });
    await loadItems();
  };

  const toggleSelected = (filename: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(filename)) {
        next.delete(filename);
      } else {
        next.add(filename);
      }
      return next;
    });
  };

  const deleteSelected = async () => {
    const targets = Array.from(selected);
    await Promise.all(
      targets.map((filename) =>
        fetch(`${API_URL}/uploads/${filename}`, { method: "DELETE" })
      )
    );
    setSelected(new Set());
    await loadItems();
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setMessage("Copied");
    setTimeout(() => setMessage(null), 1200);
  };

  const filteredItems = items.filter((item) =>
    item.filename.toLowerCase().includes(query.toLowerCase())
  );

  return (
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">
              Media Library
            </h1>
            <p className="text-sm text-slate-500">
              จัดการรูปภาพที่อัปโหลดทั้งหมด
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs">
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  uploadImage(file);
                }}
              />
            </label>
            <button
              onClick={loadItems}
              className="rounded-full bg-blue-600 px-4 py-2 text-xs text-white"
            >
              Refresh
            </button>
            <button
              onClick={deleteSelected}
              disabled={selected.size === 0}
              className="rounded-full bg-rose-100 px-4 py-2 text-xs text-rose-700 disabled:opacity-50"
            >
              Delete Selected ({selected.size})
            </button>
            {message && <span className="text-xs text-emerald-600">{message}</span>}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            className="w-full max-w-xs rounded-full border border-slate-200 bg-white px-4 py-2 text-xs"
            placeholder="Search by filename"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="mt-6">
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <div
                  key={item.filename}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="relative">
                  <img
                    src={item.thumbUrl || item.url}
                    alt={item.filename}
                    className="h-40 w-full object-cover"
                  />
                    <label className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs">
                      <input
                        type="checkbox"
                        checked={selected.has(item.filename)}
                        onChange={() => toggleSelected(item.filename)}
                      />
                      Select
                    </label>
                  </div>
                  <div className="grid gap-2 px-4 py-3 text-xs text-slate-500">
                    <p className="font-semibold text-slate-700">
                      {item.filename}
                    </p>
                    <div className="flex items-center justify-between">
                      <span>{formatSize(item.size)}</span>
                      <span>
                        {new Date(item.updatedAt).toLocaleDateString("th-TH")}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => copyUrl(item.url)}
                        className="rounded-full border border-slate-200 px-3 py-1"
                      >
                        Copy URL
                      </button>
                      <button
                        onClick={() => deleteImage(item.filename)}
                        className="rounded-full bg-rose-100 px-3 py-1 text-rose-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <p className="text-sm text-slate-500">No uploads yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
  );
}
