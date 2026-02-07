"use client";

import { useEffect, useState } from "react";
import type { Block, PageDraft, PageSummary } from "./types";
import { backendBaseUrl, resolveUploadUrl } from "@/lib/urls";

const API_URL = backendBaseUrl;

type UsePagesOptions = {
  createBlock: (type: string) => Block;
};

export function usePages({ createBlock }: UsePagesOptions) {
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [activePage, setActivePage] = useState<PageDraft | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const basePaths = ["/pages", "/api/pages"];

  const ensureBackend = () => {
    if (API_URL) return true;
    setStatusMessage(
      "Backend URL ไม่พร้อมใช้งาน: ตั้งค่า NEXT_PUBLIC_BACKEND_DEVELOPMENT_URL ใน admin/.env แล้ว restart"
    );
    return false;
  };

  const loadPages = async () => {
    if (!ensureBackend()) {
      setPages([]);
      return;
    }
    let response: Response | null = null;
    for (const path of basePaths) {
      response = await fetch(`${API_URL}${path}`);
      if (response.ok || response.status !== 404) break;
    }
    if (!response || !response.ok) {
      setStatusMessage("โหลดรายการหน้าไม่สำเร็จ");
      setPages([]);
      return;
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      setStatusMessage("โหลดรายการหน้าไม่สำเร็จ");
      setPages([]);
      return;
    }
    const data = await response.json();

    // Ensure titles are always strings (extract .th if it's an object)
    const normalizedPages = (data.pages || []).map((page: any) => ({
      ...page,
      title: typeof page.title === 'string' ? page.title : (page.title?.th || page.title?.en || 'Untitled')
    }));

    setPages(normalizedPages);
  };

  useEffect(() => {
    loadPages();
  }, []);

  const selectPage = async (page: PageSummary) => {
    if (!ensureBackend()) return;
    let response: Response | null = null;
    for (const path of basePaths) {
      response = await fetch(`${API_URL}${path}/${page.slug}?preview=1`);
      if (response.ok || response.status !== 404) break;
    }
    if (!response || !response.ok) {
      setStatusMessage("โหลดหน้าไม่สำเร็จ");
      return;
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      setStatusMessage("โหลดหน้าไม่สำเร็จ");
      return;
    }
    const data = await response.json();
    const expandUploads = (input: any): any => {
      if (Array.isArray(input)) return input.map(expandUploads);
      if (input && typeof input === "object") {
        return Object.fromEntries(
          Object.entries(input).map(([key, value]) => [
            key,
            expandUploads(value),
          ])
        );
      }
      if (typeof input === "string") return resolveUploadUrl(input);
      return input;
    };

    // Handle layout - could be language-specific object or legacy array
    let layout;
    const rawLayout = data.page?.layout;
    if (Array.isArray(rawLayout)) {
      // Legacy format: array of blocks
      layout = rawLayout.map((block: Block) => ({
        ...expandUploads(block),
        uid: crypto.randomUUID(),
      }));
    } else if (rawLayout && typeof rawLayout === 'object') {
      // New format: language-specific {th: [...], en: [...]}
      layout = {
        th: (rawLayout.th || []).map((block: Block) => ({
          ...expandUploads(block),
          uid: crypto.randomUUID(),
        })),
        en: (rawLayout.en || []).map((block: Block) => ({
          ...expandUploads(block),
          uid: crypto.randomUUID(),
        })),
      };
    } else {
      layout = [];
    }

    setActivePage({
      id: data.page.id,
      title: data.page.title,
      slug: data.page.slug,
      status: data.page.status,
      seo: expandUploads(data.page.seo || {}),
      theme: expandUploads(data.page.theme || { background: "" }),
      layout,
    });
  };

  const createPage = () => {
    setActivePage({
      title: { th: "New Page", en: "" },
      slug: "new-page",
      status: "draft",
      seo: {
        title: { th: "", en: "" },
        description: { th: "", en: "" },
      },
      theme: { background: "" },
      layout: {
        th: [createBlock("hero")],
        en: [],
      },
    });
  };

  const updatePage = (patch: Partial<PageDraft>) => {
    if (!activePage) return;
    setActivePage({ ...activePage, ...patch });
  };

  const savePage = async () => {
    if (!activePage) return;
    if (!ensureBackend()) return;

    // Prepare layout - handle both array and object formats
    let layoutPayload;
    if (Array.isArray(activePage.layout)) {
      // Legacy format: array of blocks
      layoutPayload = activePage.layout.map(({ type, props }) => ({ type, props }));
    } else if (activePage.layout && typeof activePage.layout === 'object') {
      // New format: language-specific object
      layoutPayload = {
        th: (activePage.layout.th || []).map(({ type, props }) => ({ type, props })),
        en: (activePage.layout.en || []).map(({ type, props }) => ({ type, props })),
      };
    } else {
      layoutPayload = [];
    }

    const payload = {
      title: activePage.title,
      slug: activePage.slug,
      status: activePage.status,
      seo: activePage.seo,
      theme: activePage.theme,
      layout: layoutPayload,
    };

    const requestPath = activePage.id
      ? (path: string) => `${API_URL}${path}/${activePage.id}`
      : (path: string) => `${API_URL}${path}`;
    let response: Response | null = null;
    for (const path of basePaths) {
      response = await fetch(requestPath(path), {
        method: activePage.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok || response.status !== 404) break;
    }

    if (!response || !response.ok) {
      setStatusMessage("บันทึกหน้าไม่สำเร็จ");
      return;
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      setStatusMessage("บันทึกหน้าไม่สำเร็จ");
      return;
    }
    const data = await response.json();
    if (data.page?.id) {
      setStatusMessage("Saved");
      setActivePage({
        ...activePage,
        id: data.page.id,
        slug: data.page.slug,
      });
      loadPages();
      setTimeout(() => setStatusMessage(null), 1200);
    }
  };

  const deletePage = async () => {
    if (!activePage?.id) return;
    if (!ensureBackend()) return;
    let response: Response | null = null;
    for (const path of basePaths) {
      response = await fetch(`${API_URL}${path}/${activePage.id}`, {
        method: "DELETE",
      });
      if (response.ok || response.status !== 404) break;
    }
    if (!response || !response.ok) {
      setStatusMessage("ลบหน้าไม่สำเร็จ");
      return;
    }
    setActivePage(null);
    loadPages();
  };

  return {
    pages,
    activePage,
    statusMessage,
    selectPage,
    createPage,
    updatePage,
    savePage,
    deletePage,
  };
}
