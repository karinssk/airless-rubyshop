"use client";

import { PageHeader } from "./PageHeader";
import { PageSettingsPanel } from "./PageSettingsPanel";
import { PreviewModal } from "./PreviewModal";
import type { Block, PageDraft, MultiLangString } from "./types";
import type { Language } from "./LanguageTabs";

type PageEditorPaneProps = {
  page: PageDraft;
  blocks: Block[];
  activeLanguage: Language;
  statusMessage: string | null;
  activeBlockIndex: number | null;
  activeElementLabel: string | null;
  previewOpen: boolean;
  previewMenuOpen: boolean;
  onOpenPreview: () => void;
  onClosePreview: () => void;
  onTogglePreviewMenu: () => void;
  onSave: () => void;
  onDelete: () => void;
  onUpdatePage: (patch: Partial<PageDraft>) => void;
  onAddBlock: (type: string) => void;
  onInsertBlock: (type: string, index: number) => void;
  onRemoveBlock: (index: number) => void;
  onDragEnd: (event: { active: { id: string }; over?: { id: string } }) => void;
  onSelectBlock: (index: number) => void;
  onElementSelect: (label: string) => void;
  onClearSelection: () => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
  updateBlockProps: (index: number, patch: Record<string, unknown>) => void;
  uploadImage: (file: File) => Promise<string>;
  uploadVideo?: (file: File) => Promise<string>;
};

// Helper function to extract language-specific string
function getLangString(value: MultiLangString | undefined, lang: Language): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[lang] || value.th || "";
}

export function PageEditorPane({
  page,
  blocks,
  activeLanguage,
  statusMessage,
  activeBlockIndex,
  activeElementLabel,
  previewOpen,
  previewMenuOpen,
  onOpenPreview,
  onClosePreview,
  onTogglePreviewMenu,
  onSave,
  onDelete,
  onUpdatePage,
  onAddBlock,
  onInsertBlock,
  onRemoveBlock,
  onDragEnd,
  onSelectBlock,
  onElementSelect,
  onClearSelection,
  onReorder,
  updateBlockProps,
  uploadImage,
  uploadVideo,
}: PageEditorPaneProps) {
  // Extract language-specific values
  const currentTitle = getLangString(page.title, activeLanguage);
  const currentSeoTitle = getLangString(page.seo.title, activeLanguage);
  const currentSeoDescription = getLangString(page.seo.description, activeLanguage);

  // Handler to update title in the correct language
  const handleTitleChange = (value: string) => {
    let newTitle: MultiLangString;
    if (typeof page.title === "string") {
      // Convert legacy format to new format
      newTitle = { th: activeLanguage === "th" ? value : page.title, en: activeLanguage === "en" ? value : "" };
    } else {
      // Update existing multi-lang format
      newTitle = { ...page.title, [activeLanguage]: value };
    }
    onUpdatePage({ title: newTitle });
  };

  // Handler to update SEO title in the correct language
  const handleSeoTitleChange = (value: string) => {
    let newSeoTitle: MultiLangString;
    const currentSeoTitle = page.seo.title || "";
    if (typeof currentSeoTitle === "string") {
      newSeoTitle = { th: activeLanguage === "th" ? value : currentSeoTitle, en: activeLanguage === "en" ? value : "" };
    } else {
      newSeoTitle = { ...currentSeoTitle, [activeLanguage]: value };
    }
    onUpdatePage({ seo: { ...page.seo, title: newSeoTitle } });
  };

  // Handler to update SEO description in the correct language
  const handleSeoDescriptionChange = (value: string) => {
    let newSeoDescription: MultiLangString;
    const currentSeoDesc = page.seo.description || "";
    if (typeof currentSeoDesc === "string") {
      newSeoDescription = { th: activeLanguage === "th" ? value : currentSeoDesc, en: activeLanguage === "en" ? value : "" };
    } else {
      newSeoDescription = { ...currentSeoDesc, [activeLanguage]: value };
    }
    onUpdatePage({ seo: { ...page.seo, description: newSeoDescription } });
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        title={currentTitle}
        slug={page.slug}
        statusMessage={statusMessage}
        onOpenPreview={onOpenPreview}
        onSave={onSave}
        onDelete={onDelete}
      />

      <PageSettingsPanel
        title={currentTitle}
        slug={page.slug}
        status={page.status}
        seoTitle={currentSeoTitle}
        seoDescription={currentSeoDescription}
        seoImage={page.seo.image || ""}
        background={page.theme.background || "#ffffff"}
        onTitleChange={handleTitleChange}
        onSlugChange={(value) => onUpdatePage({ slug: value })}
        onStatusChange={(value) => onUpdatePage({ status: value })}
        onSeoTitleChange={handleSeoTitleChange}
        onSeoDescriptionChange={handleSeoDescriptionChange}
        onSeoImageChange={(value) =>
          onUpdatePage({ seo: { ...page.seo, image: value } })
        }
        onSeoImageUpload={uploadImage}
        onBackgroundChange={(value) =>
          onUpdatePage({ theme: { ...page.theme, background: value } })
        }
      />

      <PreviewModal
        open={previewOpen}
        blocks={blocks}
        activeIndex={activeBlockIndex}
        background={page.theme.background}
        previewMenuOpen={previewMenuOpen}
        activeElementLabel={activeElementLabel}
        onToggleMenu={onTogglePreviewMenu}
        onClose={onClosePreview}
        onAddBlock={onAddBlock}
        onInsertBlock={onInsertBlock}
        onRemoveBlock={onRemoveBlock}
        onSave={onSave}
        onSelectBlock={onSelectBlock}
        onElementSelect={onElementSelect}
        onReorder={onReorder}
        onClearSelection={onClearSelection}
        updateBlockProps={updateBlockProps}
        uploadImage={uploadImage}
        uploadVideo={uploadVideo}
      />
    </div>
  );
}
