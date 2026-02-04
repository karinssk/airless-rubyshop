"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { defaultProps } from "./builder/config";
import { PageEditorPane } from "./builder/PageEditorPane";
import { PagesSidebar } from "./builder/PagesSidebar";
import { LanguageTabs, type Language } from "./builder/LanguageTabs";
import type { Block } from "./builder/types";
import { usePages } from "./builder/usePages";
import { backendBaseUrl } from "@/lib/urls";
import Swal from "sweetalert2";

const API_URL = backendBaseUrl;

const createBlock = (type: string): Block => ({
  uid: crypto.randomUUID(),
  type,
  props: JSON.parse(JSON.stringify(defaultProps[type] || {})),
});

export default function PagesBuilder() {
  const router = useRouter();
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<Language>("th");
  const [activeElementLabel, setActiveElementLabel] = useState<string | null>(
    null
  );
  const [previewMenuOpen, setPreviewMenuOpen] = useState(true);
  const backendMissing = !API_URL;
  const {
    pages,
    activePage,
    statusMessage,
    selectPage,
    createPage,
    updatePage,
    savePage,
    deletePage,
  } = usePages({ createBlock });

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_URL}/uploads`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error("Upload failed");
    }
    const data = await response.json();
    // Return the path (relative) instead of url (absolute)
    // This ensures images work correctly with the resolveUploadUrl helper
    return data.path as string;
  };

  // Handle save with SweetAlert notification
  const handleSave = async () => {
    await savePage();

    Swal.fire({
      icon: "success",
      title: "Saved!",
      text: `Page saved successfully (${activeLanguage === 'th' ? 'Thai' : 'English'} version)`,
      toast: true,
      position: "bottom-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  };

  // Handle delete with confirmation modal
  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will delete the page in ALL languages!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      await deletePage();

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Page has been deleted",
        toast: true,
        position: "bottom-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };

  // Get layout for current language
  const activeLayout = useMemo(() => {
    if (!activePage?.layout) return [];

    // Check if layout is language-specific (new format)
    if (typeof activePage.layout === 'object' && !Array.isArray(activePage.layout)) {
      return activePage.layout[activeLanguage] || [];
    }

    // Legacy format: layout is an array (backward compatibility)
    return activePage.layout;
  }, [activePage, activeLanguage]);

  const updateBlockProps = (
    index: number,
    patch: Record<string, unknown>
  ) => {
    if (!activePage) return;
    const next = [...activeLayout];
    next[index] = {
      ...next[index],
      props: { ...next[index].props, ...patch },
    };

    // Update layout for current language
    let newLayout;
    if (typeof activePage.layout === 'object' && !Array.isArray(activePage.layout)) {
      // New format: language-specific
      newLayout = {
        ...activePage.layout,
        [activeLanguage]: next
      };
    } else {
      // Convert legacy format to new format
      newLayout = {
        th: activeLanguage === 'th' ? next : (activePage.layout || []),
        en: activeLanguage === 'en' ? next : []
      };
    }

    updatePage({ layout: newLayout });
  };

  const addBlock = (type: string) => {
    if (!activePage) return;

    let newLayout;
    if (typeof activePage.layout === 'object' && !Array.isArray(activePage.layout)) {
      // New format
      newLayout = {
        ...activePage.layout,
        [activeLanguage]: [...activeLayout, createBlock(type)]
      };
    } else {
      // Convert legacy to new format
      newLayout = {
        th: activeLanguage === 'th' ? [...activeLayout, createBlock(type)] : (activePage.layout || []),
        en: activeLanguage === 'en' ? [...activeLayout, createBlock(type)] : []
      };
    }

    updatePage({ layout: newLayout });
  };

  const insertBlock = (type: string, index: number) => {
    if (!activePage) return;
    const next = [...activeLayout];
    const safeIndex = Math.max(0, Math.min(index, next.length));
    next.splice(safeIndex, 0, createBlock(type));

    let newLayout;
    if (typeof activePage.layout === 'object' && !Array.isArray(activePage.layout)) {
      newLayout = {
        ...activePage.layout,
        [activeLanguage]: next
      };
    } else {
      newLayout = {
        th: activeLanguage === 'th' ? next : (activePage.layout || []),
        en: activeLanguage === 'en' ? next : []
      };
    }

    updatePage({ layout: newLayout });
  };

  const removeBlock = (index: number) => {
    if (!activePage) return;
    const next = [...activeLayout];
    next.splice(index, 1);

    let newLayout;
    if (typeof activePage.layout === 'object' && !Array.isArray(activePage.layout)) {
      newLayout = {
        ...activePage.layout,
        [activeLanguage]: next
      };
    } else {
      newLayout = {
        th: activeLanguage === 'th' ? next : (activePage.layout || []),
        en: activeLanguage === 'en' ? next : []
      };
    }

    updatePage({ layout: newLayout });
  };

  const onDragEnd = (event: { active: { id: string }; over?: { id: string } }) => {
    if (!activePage || !event.over) return;
    const oldIndex = activeLayout.findIndex(
      (block) => block.uid === event.active.id
    );
    const newIndex = activeLayout.findIndex(
      (block) => block.uid === event.over?.id
    );
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const reorderedLayout = arrayMove(activeLayout, oldIndex, newIndex);

    let newLayout;
    if (typeof activePage.layout === 'object' && !Array.isArray(activePage.layout)) {
      newLayout = {
        ...activePage.layout,
        [activeLanguage]: reorderedLayout
      };
    } else {
      newLayout = {
        th: activeLanguage === 'th' ? reorderedLayout : (activePage.layout || []),
        en: activeLanguage === 'en' ? reorderedLayout : []
      };
    }

    updatePage({ layout: newLayout });
  };

  const reorderBlocks = (oldIndex: number, newIndex: number) => {
    if (!activePage) return;
    const nextLayout = arrayMove(activeLayout, oldIndex, newIndex);
    let nextActive = activeBlockIndex;
    if (nextActive !== null) {
      if (nextActive === oldIndex) {
        nextActive = newIndex;
      } else if (
        nextActive >= Math.min(oldIndex, newIndex) &&
        nextActive <= Math.max(oldIndex, newIndex)
      ) {
        nextActive = oldIndex < newIndex ? nextActive - 1 : nextActive + 1;
      }
    }
    setActiveBlockIndex(nextActive);

    let newLayout;
    if (typeof activePage.layout === 'object' && !Array.isArray(activePage.layout)) {
      newLayout = {
        ...activePage.layout,
        [activeLanguage]: nextLayout
      };
    } else {
      newLayout = {
        th: activeLanguage === 'th' ? nextLayout : (activePage.layout || []),
        en: activeLanguage === 'en' ? nextLayout : []
      };
    }

    updatePage({ layout: newLayout });
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <span aria-hidden>←</span>
          Back
        </button>
        <h1 className="text-sm font-semibold text-slate-700">Pages</h1>
      </div>
      {backendMissing && (
        <div className="mx-auto mb-4 max-w-6xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          Backend URL ไม่พร้อมใช้งาน: ตั้งค่า{" "}
          <span className="font-semibold">
            NEXT_PUBLIC_BACKEND_DEVELOPMENT_URL
          </span>{" "}
          ใน <span className="font-semibold">admin/.env</span> แล้ว restart
          admin server
        </div>
      )}
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[300px_1fr]">
        <PagesSidebar
          pages={pages}
          activePageId={activePage?.id}
          onSelectPage={selectPage}
          onCreatePage={createPage}
        />

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow">
          {!activePage ? (
            <p className="text-sm text-slate-500">
              เลือกหน้าเพื่อแก้ไข หรือสร้างหน้าใหม่
            </p>
          ) : (
            <>
              <LanguageTabs
                activeLanguage={activeLanguage}
                onLanguageChange={(lang) => {
                  setActiveLanguage(lang);
                  setActiveBlockIndex(null); // Reset selection when switching language
                }}
              />

              <PageEditorPane
                page={activePage}
                blocks={activeLayout}
                activeLanguage={activeLanguage}
                statusMessage={statusMessage}
                activeBlockIndex={activeBlockIndex}
                activeElementLabel={activeElementLabel}
                previewOpen={previewOpen}
                previewMenuOpen={previewMenuOpen}
                onOpenPreview={() => setPreviewOpen(true)}
                onClosePreview={() => setPreviewOpen(false)}
                onTogglePreviewMenu={() => setPreviewMenuOpen((prev) => !prev)}
                onSave={handleSave}
                onDelete={handleDelete}
                onUpdatePage={updatePage}
                onAddBlock={addBlock}
                onInsertBlock={insertBlock}
                onRemoveBlock={removeBlock}
                onDragEnd={onDragEnd}
                onSelectBlock={(index) => setActiveBlockIndex(index)}
                onElementSelect={(label) => setActiveElementLabel(label)}
                onClearSelection={() => {
                  setActiveBlockIndex(null);
                  setActiveElementLabel(null);
                }}
                onReorder={reorderBlocks}
                updateBlockProps={updateBlockProps}
                uploadImage={uploadImage}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
