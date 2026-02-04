"use client";

import { frontendBaseUrl } from "@/lib/urls";

type PageSettingsPanelProps = {
  title: string;
  slug: string;
  status: string;
  seoTitle: string;
  seoDescription: string;
  seoImage: string;
  background: string;
  onTitleChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSeoTitleChange: (value: string) => void;
  onSeoDescriptionChange: (value: string) => void;
  onSeoImageChange: (value: string) => void;
  onSeoImageUpload: (file: File) => Promise<string>;
  onBackgroundChange: (value: string) => void;
};

export function PageSettingsPanel({
  title,
  slug,
  status,
  seoTitle,
  seoDescription,
  seoImage,
  background,
  onTitleChange,
  onSlugChange,
  onStatusChange,
  onSeoTitleChange,
  onSeoDescriptionChange,
  onSeoImageChange,
  onSeoImageUpload,
  onBackgroundChange,
}: PageSettingsPanelProps) {
  const seoPreviewTitle = seoTitle || title || "Untitled Page";
  const seoPreviewDescription =
    seoDescription ||
    "เพิ่มคำอธิบายเพื่อให้ Google แสดงผลได้ชัดเจนและน่าเชื่อถือ";
  const seoPreviewImage =
    seoImage ||
    (frontendBaseUrl ? `${frontendBaseUrl}/og-aircon.jpg` : "/og-aircon.jpg");
  const titleLength = seoTitle.trim().length;
  const descriptionLength = seoDescription.trim().length;
  const titleStatus =
    titleLength === 0
      ? "Missing"
      : titleLength < 50
        ? "Too short"
        : titleLength > 60
          ? "Too long"
          : "Good";
  const descriptionStatus =
    descriptionLength === 0
      ? "Missing"
      : descriptionLength < 140
        ? "Too short"
        : descriptionLength > 170
          ? "Too long"
          : "Good";
  const normalizedSlug = slug ? `/${slug}` : "/";
  const previewDomain = frontendBaseUrl
    ? frontendBaseUrl.replace(/^https?:\/\//, "")
    : "your-domain.com";
  const previewUrl = `${previewDomain}${normalizedSlug}`;

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-800">Page Details</h3>
          <p className="text-xs text-slate-500">
            ตั้งค่าชื่อหน้า, slug และสถานะการเผยแพร่
          </p>
        </div>
        <div className="grid gap-4 text-sm text-slate-700 lg:grid-cols-3">
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Title
            </span>
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Slug
            </span>
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
              value={slug}
              onChange={(event) => onSlugChange(event.target.value)}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </span>
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
              value={status}
              onChange={(event) => onStatusChange(event.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-800">SEO Settings</h3>
          <p className="text-xs text-slate-500">
            ข้อมูลสำหรับผลการค้นหาและการแชร์ลิงก์
          </p>
        </div>
        <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-700">SEO Title</p>
              <p className="text-[11px] text-slate-500">
                Recommended 50-60 characters
              </p>
            </div>
            <span
              className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                titleStatus === "Good"
                  ? "bg-emerald-100 text-emerald-700"
                  : titleStatus === "Missing"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-amber-100 text-amber-700"
              }`}
            >
              {titleLength} · {titleStatus}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-700">SEO Description</p>
              <p className="text-[11px] text-slate-500">
                Recommended 140-170 characters
              </p>
            </div>
            <span
              className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                descriptionStatus === "Good"
                  ? "bg-emerald-100 text-emerald-700"
                  : descriptionStatus === "Missing"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-amber-100 text-amber-700"
              }`}
            >
              {descriptionLength} · {descriptionStatus}
            </span>
          </div>
        </div>
        <div className="grid gap-4 text-sm text-slate-700">
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              SEO Title
            </span>
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
              value={seoTitle}
              onChange={(event) => onSeoTitleChange(event.target.value)}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              SEO Description
            </span>
            <textarea
              className="min-h-[90px] rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
              value={seoDescription}
              onChange={(event) => onSeoDescriptionChange(event.target.value)}
            />
          </label>
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Social Share Image (OG Image)
              </p>
              <p className="text-xs text-slate-500">
                แนะนำขนาด 1200×630 สำหรับ Facebook, LINE, Google Preview
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <input
                className="min-w-[220px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none"
                placeholder="https://..."
                value={seoImage}
                onChange={(event) => onSeoImageChange(event.target.value)}
              />
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs shadow-sm">
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const url = await onSeoImageUpload(file);
                    onSeoImageChange(url);
                  }}
                />
              </label>
            </div>
          </div>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Page Background
            </span>
            <input
              type="color"
              className="h-11 w-28 rounded-xl border border-slate-200 bg-white px-2"
              value={background}
              onChange={(event) => onBackgroundChange(event.target.value)}
            />
          </label>
        </div>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Google Preview
          </p>
          <div className="grid gap-1 rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[10px] text-slate-600">
                R
              </span>
              <span className="font-medium text-slate-600">{previewDomain}</span>
              <span className="text-slate-400">{normalizedSlug}</span>
            </div>
            <div className="text-base font-semibold text-blue-700">
              {seoPreviewTitle}
            </div>
            <div className="text-sm text-slate-600">{seoPreviewDescription}</div>
            <div className="text-[11px] text-slate-400">{previewUrl}</div>
          </div>
          <div className="mt-4 grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Share Preview
            </p>
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="h-20 w-36 overflow-hidden rounded-xl bg-slate-100">
                <img
                  src={seoPreviewImage}
                  alt={seoPreviewTitle}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-[200px] flex-1">
                <p className="text-xs text-slate-400">{previewDomain}</p>
                <p className="text-sm font-semibold text-slate-800">
                  {seoPreviewTitle}
                </p>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {seoPreviewDescription}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
