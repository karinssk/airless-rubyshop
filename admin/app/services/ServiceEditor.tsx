"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { backendBaseUrl, resolveUploadUrl } from "@/lib/urls";
import { LanguageTabs } from "../pages/builder/LanguageTabs";
import type { MultiLangString, Language } from "./types";
import { getLangString } from "./types";

const API_URL = backendBaseUrl;

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: { default: null },
    };
  },
});

type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  order?: number;
};

type ServiceDetail = {
  id?: string;
  title: MultiLangString;
  slug: string;
  status: string;
  categoryId: string | null;
  price: MultiLangString;
  shortDescription: MultiLangString;
  rating: number;
  reviewCount: number;
  coverImage: string;
  gallery: string[];
  videos: string[];
  seo: { title: MultiLangString; description: MultiLangString; image: string };
  content: Record<string, any>;
};

const emptyService = (): ServiceDetail => ({
  title: { th: "บริการใหม่", en: "New Service" },
  slug: "new-service",
  status: "draft",
  categoryId: null,
  price: { th: "", en: "" },
  shortDescription: { th: "", en: "" },
  rating: 5,
  reviewCount: 0,
  coverImage: "",
  gallery: [],
  videos: [],
  seo: { title: { th: "", en: "" }, description: { th: "", en: "" }, image: "" },
  content: { type: "doc", content: [{ type: "paragraph" }] },
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function ServiceEditor({ slug }: { slug?: string }) {
  const router = useRouter();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [activeService, setActiveService] = useState<ServiceDetail | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<Language>("th");

  // Helper to extract language-specific string
  const getLabel = (label: MultiLangString | undefined): string => {
    return getLangString(label, activeLanguage);
  };

  // Helper to update multi-language string
  const updateMultiLangString = (
    current: MultiLangString | undefined,
    newValue: string
  ): MultiLangString => {
    if (!current || typeof current === "string") {
      return {
        th: activeLanguage === "th" ? newValue : (current as string) || "",
        en: activeLanguage === "en" ? newValue : "",
      };
    }
    return { ...current, [activeLanguage]: newValue };
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      Underline,
      TextStyle,
      Color,
      Link.configure({ openOnClick: false }),
      ResizableImage.configure({ inline: false }),
      Placeholder.configure({
        placeholder: "พิมพ์รายละเอียดบริการที่นี่...",
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: activeService?.content || emptyService().content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none focus:outline-none prose-headings:text-slate-900 prose-p:text-slate-700",
      },
    },
  });

  useEffect(() => {
    if (!editor || !activeService?.content) return;
    editor.commands.setContent(activeService.content);
  }, [activeService?.content, editor]);

  useEffect(() => {
    const loadCategories = async () => {
      if (!API_URL) return;
      const response = await fetch(`${API_URL}/service-categories`);
      const data = await response.json();
      setCategories(data.categories || []);
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadService = async () => {
      if (!API_URL) {
        setLoadError("Backend URL not configured");
        setLoading(false);
        return;
      }
      if (!slug) {
        setActiveService(emptyService());
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadError(null);
      try {
        const response = await fetch(`${API_URL}/services/${slug}?preview=1`);
        if (!response.ok) {
          setLoadError("Service not found");
          setActiveService(null);
          setLoading(false);
          return;
        }
        const data = await response.json();
        const full = data.service;
        setActiveService({
          id: full.id,
          title: full.title || { th: "", en: "" },
          slug: full.slug,
          status: full.status,
          categoryId: full.category?.id || null,
          price: full.price || { th: "", en: "" },
          shortDescription: full.shortDescription || { th: "", en: "" },
          rating: full.rating || 0,
          reviewCount: full.reviewCount || 0,
          coverImage: full.coverImage || "",
          gallery: full.gallery || [],
          videos: full.videos || [],
          seo: {
            title: full.seo?.title || { th: "", en: "" },
            description: full.seo?.description || { th: "", en: "" },
            image: full.seo?.image || "",
          },
          content: full.content || emptyService().content,
        });
      } catch (error) {
        console.error(error);
        setLoadError("Failed to load service");
        setActiveService(null);
      } finally {
        setLoading(false);
      }
    };

    loadService();
  }, [slug]);

  const uploadImage = async (file: File) => {
    if (!API_URL) return "";
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_URL}/uploads`, {
      method: "POST",
      body: formData,
    });
    setUploading(false);
    if (!response.ok) return "";
    const data = await response.json();
    return data.url as string;
  };

  const updateService = (patch: Partial<ServiceDetail>) => {
    if (!activeService) return;
    setActiveService({ ...activeService, ...patch });
  };

  const saveService = async () => {
    if (!activeService || !API_URL || !editor) return;
    const payload = {
      title: activeService.title,
      slug: activeService.slug,
      status: activeService.status,
      categoryId: activeService.categoryId,
      price: activeService.price,
      shortDescription: activeService.shortDescription,
      rating: activeService.rating,
      reviewCount: activeService.reviewCount,
      coverImage: activeService.coverImage,
      gallery: activeService.gallery,
      videos: activeService.videos,
      seo: activeService.seo,
      content: editor.getJSON(),
    };
    const response = activeService.id
      ? await fetch(`${API_URL}/services/${activeService.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch(`${API_URL}/services`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    const data = await response.json();
    if (data.service?.id) {
      const nextSlug = data.service.slug || activeService.slug;
      setActiveService({ ...activeService, id: data.service.id, slug: nextSlug });
      setStatusMessage("Saved");
      if (!slug || slug !== nextSlug) {
        router.replace(`/services/${nextSlug}`);
      }
      setTimeout(() => setStatusMessage(null), 1500);
    }
  };

  const deleteService = async () => {
    if (!activeService?.id || !API_URL) return;
    await fetch(`${API_URL}/services/${activeService.id}`, { method: "DELETE" });
    router.push("/services");
  };

  const toolbarButtonClass = (active?: boolean) =>
    `inline-flex h-8 w-8 items-center justify-center rounded-md border text-xs font-semibold transition ${
      active
        ? "border-blue-700 bg-blue-700 text-white shadow-sm"
        : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:text-slate-900"
    }`;

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow">
        <p className="text-sm text-slate-500">Loading service...</p>
      </div>
    );
  }

  if (loadError || !activeService) {
    return (
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow">
        <p className="text-sm text-slate-500">{loadError || "No service found"}</p>
        <NextLink
          href="/services"
          className="mt-4 inline-flex rounded-full border border-slate-200 px-4 py-2 text-xs"
        >
          Back to services
        </NextLink>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Service Editor
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            {getLabel(activeService.title)}
          </h1>
          <p className="text-sm text-slate-500">/services/{activeService.slug}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <NextLink
            href="/services"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm"
          >
            Back to list
          </NextLink>
          <button
            onClick={saveService}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm text-white shadow-sm"
          >
            Save
          </button>
          <button
            onClick={deleteService}
            className="rounded-full bg-rose-100 px-4 py-2 text-sm text-rose-700 shadow-sm"
          >
            Delete
          </button>
          {statusMessage && (
            <span className="self-center text-sm font-semibold text-emerald-600">
              {statusMessage}
            </span>
          )}
        </div>
      </div>

      {/* Language Tabs */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
        <LanguageTabs
          activeLanguage={activeLanguage}
          onLanguageChange={setActiveLanguage}
        />
      </div>

      <div className="grid gap-6">
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Title
              </span>
              <input
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
                value={getLabel(activeService.title)}
                onChange={(event) =>
                  updateService({
                    title: updateMultiLangString(activeService.title, event.target.value),
                    slug: !slug ? slugify(event.target.value) : activeService.slug
                  })
                }
              />
            </label>
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Slug
              </span>
              <input
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
                value={activeService.slug}
                onChange={(event) =>
                  updateService({ slug: slugify(event.target.value) })
                }
              />
            </label>
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </span>
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
                value={activeService.status}
                onChange={(event) =>
                  updateService({ status: event.target.value })
                }
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Category
              </span>
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
                value={activeService.categoryId || ""}
                onChange={(event) =>
                  updateService({
                    categoryId: event.target.value || null,
                  })
                }
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Price
              </span>
              <input
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
                value={getLabel(activeService.price)}
                onChange={(event) =>
                  updateService({ price: updateMultiLangString(activeService.price, event.target.value) })
                }
              />
            </label>
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Rating
              </span>
              <input
                type="number"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
                value={activeService.rating}
                onChange={(event) =>
                  updateService({
                    rating: Number(event.target.value || 0),
                  })
                }
              />
            </label>
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Review Count
              </span>
              <input
                type="number"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
                value={activeService.reviewCount}
                onChange={(event) =>
                  updateService({
                    reviewCount: Number(event.target.value || 0),
                  })
                }
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm text-slate-700">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Short Description
            </span>
            <textarea
              className="min-h-[80px] rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
              value={getLabel(activeService.shortDescription)}
              onChange={(event) =>
                updateService({ shortDescription: updateMultiLangString(activeService.shortDescription, event.target.value) })
              }
            />
          </label>
        </div>

        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">Media Gallery</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Cover Image URL
              </span>
              <input
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
                value={activeService.coverImage}
                onChange={(event) =>
                  updateService({ coverImage: event.target.value })
                }
              />
            </label>
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Upload Cover Image
              </span>
              <input
                type="file"
                accept="image/*"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const url = await uploadImage(file);
                  if (url) updateService({ coverImage: url });
                }}
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm text-slate-700">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Upload Gallery Images
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
              onChange={async (event) => {
                const files = Array.from(event.target.files || []);
                if (!files.length) return;
                const urls = await Promise.all(
                  files.map((file) => uploadImage(file))
                );
                updateService({
                  gallery: [...activeService.gallery, ...urls.filter(Boolean)],
                });
              }}
            />
          </label>
          {uploading && (
            <span className="text-xs text-slate-400">Uploading...</span>
          )}
          <div className="grid gap-3 md:grid-cols-3">
            {activeService.gallery.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="rounded-2xl border border-slate-200 bg-white p-2"
              >
                <img
                  src={resolveUploadUrl(url)}
                  alt={`Gallery ${index + 1}`}
                  className="h-24 w-full rounded-xl object-cover"
                />
                <div className="mt-2 flex items-center justify-between text-xs">
                  <button
                    onClick={() =>
                      updateService({
                        coverImage: url,
                      })
                    }
                    className="text-blue-600"
                  >
                    Set cover
                  </button>
                  <button
                    onClick={() =>
                      updateService({
                        gallery: activeService.gallery.filter(
                          (_item, idx) => idx !== index
                        ),
                      })
                    }
                    className="text-rose-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">
            Video Links (YouTube/Vimeo)
          </h3>
          <div className="grid gap-3">
            {activeService.videos.map((url, index) => (
              <div key={`${url}-${index}`} className="flex items-center gap-2">
                <input
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={url}
                  onChange={(event) =>
                    updateService({
                      videos: activeService.videos.map((item, idx) =>
                        idx === index ? event.target.value : item
                      ),
                    })
                  }
                />
                <button
                  onClick={() =>
                    updateService({
                      videos: activeService.videos.filter(
                        (_item, idx) => idx !== index
                      ),
                    })
                  }
                  className="rounded-full bg-rose-100 px-3 py-1 text-xs text-rose-700"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                updateService({ videos: [...activeService.videos, ""] })
              }
              className="w-fit rounded-full border border-slate-200 px-3 py-1 text-xs"
            >
              + Add video link
            </button>
          </div>
        </div>

        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">SEO Settings</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                SEO Title
              </span>
              <input
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
                value={getLabel(activeService.seo.title)}
                onChange={(event) =>
                  updateService({
                    seo: { ...activeService.seo, title: updateMultiLangString(activeService.seo.title, event.target.value) },
                  })
                }
              />
            </label>
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                SEO Image
              </span>
              <input
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
                value={activeService.seo.image}
                onChange={(event) =>
                  updateService({
                    seo: { ...activeService.seo, image: event.target.value },
                  })
                }
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm text-slate-700">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              SEO Description
            </span>
            <textarea
              className="min-h-[80px] rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
              value={getLabel(activeService.seo.description)}
              onChange={(event) =>
                updateService({
                  seo: {
                    ...activeService.seo,
                    description: updateMultiLangString(activeService.seo.description, event.target.value),
                  },
                })
              }
            />
          </label>
        </div>

        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={toolbarButtonClass(editor?.isActive("bold"))}
                title="Bold"
              >
                <span className="text-sm font-black">B</span>
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={toolbarButtonClass(editor?.isActive("italic"))}
                title="Italic"
              >
                <span className="text-sm italic">I</span>
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                className={toolbarButtonClass(editor?.isActive("underline"))}
                title="Underline"
              >
                <span className="text-sm underline">U</span>
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={toolbarButtonClass(editor?.isActive("bulletList"))}
                title="Bullet List"
              >
                ••
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                className={toolbarButtonClass(editor?.isActive("orderedList"))}
                title="Numbered"
              >
                1.
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().setTextAlign("left").run()}
                className={toolbarButtonClass(
                  editor?.isActive({ textAlign: "left" })
                )}
                title="Align Left"
              >
                L
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().setTextAlign("center").run()}
                className={toolbarButtonClass(
                  editor?.isActive({ textAlign: "center" })
                )}
                title="Align Center"
              >
                C
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().setTextAlign("right").run()}
                className={toolbarButtonClass(
                  editor?.isActive({ textAlign: "right" })
                )}
                title="Align Right"
              >
                R
              </button>
              <label className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 shadow-sm hover:border-slate-300">
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file);
                    if (url) {
                      editor
                        ?.chain()
                        .focus()
                        .setImage({ src: url })
                        .updateAttributes("image", {
                          style: "width: 100%; height: auto;",
                        })
                        .run();
                    }
                  }}
                />
              </label>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-inner">
            <EditorContent editor={editor} className="min-h-[320px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
