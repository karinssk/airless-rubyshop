"use client";

import { blockCatalog, thumbnailMap } from "./config";
import { BlockEditor } from "./editors";
import { LivePreview } from "./previews";
import type { Block } from "./types";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { GripVertical, X, Save, Menu, FileEdit, PanelRightClose, PanelRightOpen } from "lucide-react";

type PreviewModalProps = {
  open: boolean;
  blocks: Block[];
  activeIndex: number | null;
  background?: string;
  previewMenuOpen: boolean;
  activeElementLabel: string | null;
  onToggleMenu: () => void;
  onClose: () => void;
  onAddBlock: (type: string) => void;
  onInsertBlock: (type: string, index: number) => void;
  onRemoveBlock: (index: number) => void;
  onSave: () => void;
  onSelectBlock: (index: number) => void;
  onElementSelect: (label: string) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
  onClearSelection: () => void;
  updateBlockProps: (index: number, patch: Record<string, unknown>) => void;
  uploadImage: (file: File) => Promise<string>;
  uploadVideo?: (
    file: File,
    onProgress?: (stage: "upload" | "convert", percent: number) => void
  ) => Promise<string>;
};

export function PreviewModal({
  open,
  blocks,
  activeIndex,
  background,
  previewMenuOpen,
  activeElementLabel,
  onToggleMenu,
  onClose,
  onAddBlock,
  onInsertBlock,
  onRemoveBlock,
  onSave,
  onSelectBlock,
  onElementSelect,
  onReorder,
  onClearSelection,
  updateBlockProps,
  uploadImage,
  uploadVideo,
}: PreviewModalProps) {
  const [dropTarget, setDropTarget] = useState<{
    index: number;
    position: "before" | "after";
  } | null>(null);
  const [blockQuery, setBlockQuery] = useState("");

  // Inline editor docked/floating state
  const [isDocked, setIsDocked] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('editorDocked');
      return saved !== null ? saved === 'true' : true; // Default to docked
    }
    return true;
  });

  // Inline editor drag and resize state
  const [editorPosition, setEditorPosition] = useState({ x: 0, y: 96 });
  const [editorSize, setEditorSize] = useState({ width: 360, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>("");
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    posX: 0,
    posY: 0
  });

  // Toggle dock/undock
  const toggleDock = () => {
    const newDocked = !isDocked;
    setIsDocked(newDocked);
    localStorage.setItem('editorDocked', String(newDocked));
  };

  // Wrapped upload function with success notification
  const handleUploadImage = async (file: File): Promise<string> => {
    try {
      const url = await uploadImage(file);

      // Show success notification at bottom right
      Swal.fire({
        icon: "success",
        title: "Upload Successful!",
        text: `${file.name} has been uploaded`,
        toast: true,
        position: "bottom-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      return url;
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: "Failed to upload image. Please try again.",
        toast: true,
        position: "bottom-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      throw error;
    }
  };

  const handleUploadVideo = async (
    file: File,
    onProgress?: (stage: "upload" | "convert", percent: number) => void
  ): Promise<string> => {
    if (!uploadVideo) {
      throw new Error("Video upload is not configured");
    }
    try {
      const url = await uploadVideo(file, onProgress);

      Swal.fire({
        icon: "success",
        title: "Upload Successful!",
        text: `${file.name} has been uploaded`,
        toast: true,
        position: "bottom-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      return url;
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: "Failed to upload video. Please try again.",
        toast: true,
        position: "bottom-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      throw error;
    }
  };

  // Wrapped save function with notification
  const handleSave = () => {
    onSave();

    Swal.fire({
      icon: "success",
      title: "Saved!",
      text: "Your changes have been saved successfully",
      toast: true,
      position: "bottom-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  };

  // Handle dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        // Get screen boundaries
        const maxY = window.innerHeight - 200;
        const minX = -window.innerWidth + editorSize.width + 24;
        const minY = 64;

        // Constrain position within screen bounds
        const constrainedX = Math.max(minX, Math.min(0, newX));
        const constrainedY = Math.max(minY, Math.min(maxY, newY));

        setEditorPosition({
          x: constrainedX,
          y: constrainedY,
        });
      }

      if (isResizing) {
        e.preventDefault();
        let newWidth = editorSize.width;
        let newHeight = editorSize.height;
        let newX = editorPosition.x;
        let newY = editorPosition.y;

        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

        // Calculate screen boundaries
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const minWidth = 280;
        const minHeight = 300;
        const headerHeight = 64; // Top header height
        const padding = 24;

        // Handle different resize directions with boundary constraints
        if (resizeDirection.includes("left")) {
          // Calculate max width when resizing from left (limited by right edge position)
          const rightEdge = screenWidth + editorPosition.x;
          const maxWidthFromLeft = rightEdge - padding;

          newWidth = Math.max(minWidth, Math.min(maxWidthFromLeft, resizeStart.width - deltaX));
          newX = resizeStart.posX + (resizeStart.width - newWidth);

          // Ensure left edge doesn't go beyond left screen boundary
          const leftEdge = screenWidth + newX;
          if (leftEdge < padding) {
            newX = padding - screenWidth;
            newWidth = rightEdge - padding;
          }
        }

        if (resizeDirection.includes("right")) {
          // Calculate max width when resizing from right (limited by screen width)
          const leftEdge = screenWidth + editorPosition.x;
          const maxWidthFromRight = screenWidth - leftEdge - padding;

          newWidth = Math.max(minWidth, Math.min(maxWidthFromRight, resizeStart.width + deltaX));
        }

        if (resizeDirection.includes("top")) {
          // Calculate max height when resizing from top (limited by bottom edge position)
          const bottomEdge = editorPosition.y + editorSize.height;
          const maxHeightFromTop = bottomEdge - headerHeight;

          newHeight = Math.max(minHeight, Math.min(maxHeightFromTop, resizeStart.height - deltaY));
          newY = resizeStart.posY + (resizeStart.height - newHeight);

          // Ensure top edge doesn't go above header
          if (newY < headerHeight) {
            newY = headerHeight;
            newHeight = bottomEdge - headerHeight;
          }
        }

        if (resizeDirection.includes("bottom")) {
          // Calculate max height when resizing from bottom (limited by screen height)
          const maxHeightFromBottom = screenHeight - editorPosition.y - padding;

          newHeight = Math.max(minHeight, Math.min(maxHeightFromBottom, resizeStart.height + deltaY));
        }

        setEditorSize({ width: newWidth, height: newHeight });
        setEditorPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection("");
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart, editorSize, editorPosition, resizeDirection]);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - editorPosition.x,
      y: e.clientY - editorPosition.y
    });
  };

  const handleResizeStart = (direction: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: editorSize.width,
      height: editorSize.height,
      posX: editorPosition.x,
      posY: editorPosition.y
    });
  };

  const filteredBlocks = useMemo(() => {
    const query = blockQuery.trim().toLowerCase();
    if (!query) return blockCatalog;
    return blockCatalog.filter((block) =>
      `${block.label} ${block.type}`.toLowerCase().includes(query)
    );
  }, [blockQuery]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-6 py-4 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Full Page Preview
          </h2>
          <p className="text-xs text-muted-foreground">
            Click a section to edit inline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onToggleMenu}
            variant="outline"
            size="sm"
            aria-label="Toggle block menu"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleSave}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
          >
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        {previewMenuOpen && (
          <aside className="flex w-72 flex-col border-r bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Page Blocks
            </p>
            <Input
              value={blockQuery}
              onChange={(event) => setBlockQuery(event.target.value)}
              placeholder="Search blocks..."
              className="mb-4"
            />
            <div className="grid flex-1 content-start auto-rows-max gap-3 overflow-y-auto pb-6">
              {filteredBlocks.map((block) => (
                <button
                  key={block.type}
                  onClick={() => onAddBlock(block.type)}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("block-type", block.type);
                    event.dataTransfer.effectAllowed = "copy";
                  }}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3 text-left shadow-sm hover:border-primary transition-colors"
                >
                  <div className="relative h-12 w-16 overflow-hidden rounded-md border bg-muted">
                    <img
                      src={
                        thumbnailMap[block.type as keyof typeof thumbnailMap]
                      }
                      alt={`${block.label} thumbnail`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {block.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      + Add {block.label}
                    </p>
                  </div>
                </button>
              ))}
              {filteredBlocks.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No blocks match your search.
                </p>
              )}
            </div>
          </aside>
        )}

        {/* Main Preview Area */}
        <div
          className={`flex-1 overflow-y-auto ${isDocked && activeIndex !== null ? 'mr-[400px]' : ''}`}
          style={{ transition: 'margin-right 0.3s ease' }}
          onDragOver={(event) => {
            if (!event.dataTransfer.types.includes("block-type")) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }}
          onDragLeave={(event) => {
            const related = event.relatedTarget as HTMLElement | null;
            if (related && event.currentTarget.contains(related)) return;
            setDropTarget(null);
          }}
          onDrop={(event) => {
            const type = event.dataTransfer.getData("block-type");
            if (!type) return;
            event.preventDefault();
            if (dropTarget) {
              const insertIndex =
                dropTarget.position === "after"
                  ? dropTarget.index + 1
                  : dropTarget.index;
              onInsertBlock(type, insertIndex);
              setDropTarget(null);
              return;
            }
            onAddBlock(type);
            setDropTarget(null);
          }}
        >
          <LivePreview
            blocks={blocks}
            activeIndex={activeIndex}
            background={background}
            onSelect={onSelectBlock}
            onElementSelect={onElementSelect}
            onReorder={onReorder}
            onUpdateBlock={updateBlockProps}
            onRemoveBlock={onRemoveBlock}
            dropTarget={dropTarget}
            onDropHover={(index, position) =>
              setDropTarget({ index, position })
            }
          />
        </div>
      </div>

      {/* Inline Editor Card */}
      {activeIndex !== null && (
        <Card
          className={`z-20 shadow-2xl border-2 overflow-hidden flex flex-col transition-all duration-300 ${isDocked
              ? 'fixed right-0 top-16 h-[calc(100vh-64px)]'
              : 'fixed'
            }`}
          style={
            isDocked
              ? {
                width: '400px',
              }
              : {
                right: `${-editorPosition.x}px`,
                top: `${editorPosition.y}px`,
                width: `${editorSize.width}px`,
                height: `${editorSize.height}px`,
                cursor: isDragging ? "grabbing" : "default",
              }
          }
        >
          {/* Resize handles - Only show when undocked */}
          {!isDocked && (
            <>
              <div
                className="absolute left-0 top-0 h-full w-2 cursor-ew-resize hover:bg-primary/30 transition-colors z-10"
                onMouseDown={handleResizeStart("left")}
              />
              <div
                className="absolute right-0 top-0 h-full w-2 cursor-ew-resize hover:bg-primary/30 transition-colors z-10"
                onMouseDown={handleResizeStart("right")}
              />
              <div
                className="absolute top-0 left-0 w-full h-2 cursor-ns-resize hover:bg-primary/30 transition-colors z-10"
                onMouseDown={handleResizeStart("top")}
              />
              <div
                className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize hover:bg-primary/30 transition-colors z-10"
                onMouseDown={handleResizeStart("bottom")}
              />

              {/* Resize handles - Corners */}
              <div
                className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize hover:bg-primary/40 transition-colors z-20 rounded-tl-lg"
                onMouseDown={handleResizeStart("top-left")}
              />
              <div
                className="absolute top-0 right-0 w-4 h-4 cursor-nesw-resize hover:bg-primary/40 transition-colors z-20 rounded-tr-lg"
                onMouseDown={handleResizeStart("top-right")}
              />
              <div
                className="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize hover:bg-primary/40 transition-colors z-20 rounded-bl-lg"
                onMouseDown={handleResizeStart("bottom-left")}
              />
              <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize hover:bg-primary/40 transition-colors z-20 rounded-br-lg"
                onMouseDown={handleResizeStart("bottom-right")}
              />
            </>
          )}

          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base flex items-center gap-2 truncate">
                  <FileEdit className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Inline Editor</span>
                </CardTitle>
                <CardDescription className="mt-1 truncate">
                  {activeElementLabel
                    ? `Editing: ${activeElementLabel}`
                    : "Select a section to edit"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  onClick={toggleDock}
                  variant="outline"
                  size="sm"
                  title={isDocked ? "Undock editor" : "Dock to right"}
                >
                  {isDocked ? (
                    <PanelRightOpen className="h-4 w-4" />
                  ) : (
                    <PanelRightClose className="h-4 w-4" />
                  )}
                </Button>
                {!isDocked && (
                  <Button
                    onMouseDown={handleDragStart}
                    variant="outline"
                    size="sm"
                    className="cursor-grab active:cursor-grabbing"
                    title="Drag to move"
                  >
                    <GripVertical className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  onClick={onClearSelection}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1">
              {activeIndex === null || !blocks[activeIndex] ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileEdit className="h-16 w-16 text-muted-foreground/40 mb-4" />
                  <p className="text-sm font-semibold text-foreground">
                    {activeIndex === null ? "No section selected" : "Section not found"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click on a section to edit
                  </p>
                </div>
              ) : (
                <div className="inline-editor-content">
                  <BlockEditor
                    block={blocks[activeIndex]}
                    index={activeIndex}
                    updateBlockProps={updateBlockProps}
                    uploadImage={handleUploadImage}
                    uploadVideo={uploadVideo ? handleUploadVideo : undefined}
                  />
                </div>
              )}
            </div>
          </CardContent>
          <style jsx>{`
          /* ===== CONTAINER OVERFLOW CONTROL ===== */
          .inline-editor-content {
            max-width: 100%;
            overflow-x: hidden;
            word-wrap: break-word;
          }

          .inline-editor-content :global(*) {
            max-width: 100%;
            box-sizing: border-box;
          }

          /* ===== LABELS ===== */
          .inline-editor-content :global(label) {
            display: block;
            font-size: 0.8125rem;
            font-weight: 700;
            color: #334155;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding-left: 0.125rem;
          }

          /* ===== TEXT INPUTS ===== */
          .inline-editor-content :global(input[type="text"]),
          .inline-editor-content :global(input[type="url"]),
          .inline-editor-content :global(input[type="email"]),
          .inline-editor-content :global(input[type="number"]) {
            width: 100%;
            max-width: 100%;
            border: 2px solid #cbd5e1;
            border-radius: 0.5rem;
            padding: 0.75rem 0.875rem;
            font-size: 0.9375rem;
            font-weight: 500;
            color: #0f172a;
            background: #ffffff;
            transition: all 0.2s ease;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            box-sizing: border-box;
          }

          .inline-editor-content :global(input[type="text"]:focus),
          .inline-editor-content :global(input[type="url"]:focus),
          .inline-editor-content :global(input[type="email"]:focus),
          .inline-editor-content :global(input[type="number"]:focus) {
            outline: none;
            border-color: #3b82f6;
            background: #ffffff;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          .inline-editor-content :global(input::placeholder) {
            color: #94a3b8;
            font-weight: 400;
            font-size: 0.875rem;
          }

          /* ===== TEXTAREA ===== */
          .inline-editor-content :global(textarea) {
            width: 100%;
            max-width: 100%;
            border: 2px solid #cbd5e1;
            border-radius: 0.5rem;
            padding: 0.75rem 0.875rem;
            font-size: 0.875rem;
            font-weight: 400;
            color: #1e293b;
            background: #ffffff;
            transition: all 0.2s ease;
            resize: vertical;
            min-height: 100px;
            line-height: 1.6;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            box-sizing: border-box;
          }

          .inline-editor-content :global(textarea:focus) {
            outline: none;
            border-color: #3b82f6;
            background: #ffffff;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          .inline-editor-content :global(textarea::placeholder) {
            color: #94a3b8;
            font-weight: 400;
            font-size: 0.8125rem;
          }

          /* ===== SELECT DROPDOWNS ===== */
          .inline-editor-content :global(select) {
            width: 100%;
            max-width: 100%;
            border: 2px solid #cbd5e1;
            border-radius: 0.5rem;
            padding: 0.75rem 0.875rem;
            font-size: 0.9375rem;
            font-weight: 500;
            color: #0f172a;
            background: #ffffff;
            transition: all 0.2s ease;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            cursor: pointer;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
            background-position: right 0.5rem center;
            background-repeat: no-repeat;
            background-size: 1.5em 1.5em;
            padding-right: 2.5rem;
            box-sizing: border-box;
          }

          .inline-editor-content :global(select:focus) {
            outline: none;
            border-color: #3b82f6;
            background-color: #ffffff;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          /* ===== BUTTONS ===== */
          .inline-editor-content :global(button) {
            font-weight: 600;
            transition: all 0.2s ease;
            cursor: pointer;
            font-size: 0.875rem;
            border-radius: 0.5rem;
            padding: 0.625rem 1rem;
          }

          .inline-editor-content :global(button:hover) {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
          }

          .inline-editor-content :global(button:active) {
            transform: translateY(0px);
          }

          /* ===== DELETE BUTTONS (RED) ===== */
          .inline-editor-content :global(.bg-rose-50),
          .inline-editor-content :global(button.bg-rose-50) {
            background-color: #fef2f2 !important;
            color: #dc2626 !important;
            border-color: #fecaca !important;
          }

          .inline-editor-content :global(.bg-rose-50:hover),
          .inline-editor-content :global(button.bg-rose-50:hover) {
            background-color: #fee2e2 !important;
            color: #b91c1c !important;
            border-color: #fca5a5 !important;
          }

          .inline-editor-content :global(.text-rose-600) {
            color: #dc2626 !important;
          }

          /* ===== HELPER TEXT ===== */
          .inline-editor-content :global(.text-xs) {
            font-size: 0.75rem;
            font-weight: 400;
            color: #64748b;
            line-height: 1.4;
          }

          .inline-editor-content :global(.text-slate-400) {
            color: #94a3b8;
            font-weight: 400;
            font-size: 0.8125rem;
          }

          .inline-editor-content :global(.text-slate-500) {
            color: #64748b;
            font-weight: 500;
            font-size: 0.875rem;
          }

          .inline-editor-content :global(.text-slate-600) {
            color: #475569;
            font-weight: 600;
            font-size: 0.9375rem;
          }

          .inline-editor-content :global(.text-slate-700) {
            color: #334155;
            font-weight: 600;
            font-size: 1rem;
          }

          /* ===== COLOR PICKER ===== */
          .inline-editor-content :global(input[type="color"]) {
            height: 48px;
            width: 100%;
            max-width: 120px;
            border: 2px solid #cbd5e1;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: all 0.2s;
            padding: 0.25rem;
          }

          .inline-editor-content :global(input[type="color"]:hover) {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          /* ===== SPACING & LAYOUT ===== */
          .inline-editor-content :global(.grid.gap-1) {
            gap: 0.5rem;
          }

          .inline-editor-content :global(.grid.gap-2) {
            gap: 1rem;
            margin-bottom: 1.25rem;
          }

          .inline-editor-content :global(.grid.gap-3) {
            gap: 1.5rem;
            margin-bottom: 1.5rem;
          }

          /* ===== ROUNDED CONTAINERS ===== */
          .inline-editor-content :global(.rounded-2xl) {
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
            border: 2px solid #e2e8f0 !important;
            max-width: 100%;
            overflow: hidden;
          }

          .inline-editor-content :global(.grid) {
            max-width: 100%;
          }

          .inline-editor-content :global(img) {
            max-width: 100%;
            height: auto;
          }

          /* ===== FORM GROUPS ===== */
          .inline-editor-content :global(> div) {
            margin-bottom: 1.25rem;
          }

          .inline-editor-content :global(> div:last-child) {
            margin-bottom: 0;
          }

          /* ===== SECTION DIVIDERS ===== */
          .inline-editor-content :global(hr) {
            border: none;
            border-top: 2px solid #e2e8f0;
            margin: 1.5rem 0;
          }

          /* ===== BACKGROUND COLORS ===== */
          .inline-editor-content :global(.bg-white) {
            background-color: #ffffff !important;
          }

          .inline-editor-content :global(.bg-slate-50) {
            background-color: #f8fafc !important;
          }

          .inline-editor-content :global(.bg-blue-50) {
            background-color: #eff6ff !important;
          }

          /* ===== DISABLED STATES ===== */
          .inline-editor-content :global(input:disabled),
          .inline-editor-content :global(textarea:disabled),
          .inline-editor-content :global(select:disabled),
          .inline-editor-content :global(button:disabled) {
            opacity: 0.5;
            cursor: not-allowed;
          }

          /* ===== CHECKBOX & RADIO ===== */
          .inline-editor-content :global(input[type="checkbox"]),
          .inline-editor-content :global(input[type="radio"]) {
            width: 1.125rem;
            height: 1.125rem;
            border: 2px solid #cbd5e1;
            cursor: pointer;
            margin-right: 0.5rem;
          }

          .inline-editor-content :global(input[type="checkbox"]:checked),
          .inline-editor-content :global(input[type="radio"]:checked) {
            accent-color: #3b82f6;
          }

          /* ===== FILE UPLOAD BUTTON ===== */
          .inline-editor-content :global(input[type="file"]) {
            width: 100%;
            padding: 0;
            border: none;
            background: transparent;
            cursor: pointer;
            font-size: 0.875rem;
          }

          .inline-editor-content :global(input[type="file"]::file-selector-button) {
            padding: 0.625rem 1.25rem;
            margin-right: 1rem;
            border: 2px solid #3b82f6;
            border-radius: 0.5rem;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            font-weight: 600;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
          }

          .inline-editor-content :global(input[type="file"]::file-selector-button:hover) {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
          }

          .inline-editor-content :global(input[type="file"]::file-selector-button:active) {
            transform: translateY(0);
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
          }
        `}</style>
        </Card>
      )}
    </div>
  );
}
