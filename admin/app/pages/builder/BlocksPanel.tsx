"use client";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { blockCatalog } from "./config";
import { BlockEditor } from "./editors";
import type { Block } from "./types";

type BlocksPanelProps = {
  blocks: Block[];
  activeIndex: number | null;
  onAddBlock: (type: string) => void;
  onRemoveBlock: (index: number) => void;
  onDragEnd: (event: DragEndEvent) => void;
  updateBlockProps: (index: number, patch: Record<string, unknown>) => void;
  uploadImage: (file: File) => Promise<string>;
};

export function BlocksPanel({
  blocks,
  activeIndex,
  onAddBlock,
  onRemoveBlock,
  onDragEnd,
  updateBlockProps,
  uploadImage,
}: BlocksPanelProps) {
  const sensors = useSensors(useSensor(PointerSensor));

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Page Blocks</h3>
        <div className="flex flex-wrap gap-2">
          {blockCatalog.map((block) => (
            <button
              key={block.type}
              onClick={() => onAddBlock(block.type)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
            >
              + {block.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={blocks.map((block) => block.uid)}
            strategy={verticalListSortingStrategy}
          >
            {blocks.map((block, index) => (
              <div
                key={block.uid}
                className={`grid gap-3 rounded-2xl border p-3 ${activeIndex === index
                  ? "border-blue-400 bg-blue-50"
                  : "border-transparent"
                  }`}
              >
                <SortableBlock block={block} onRemove={() => onRemoveBlock(index)} />
                <BlockEditor
                  block={block}
                  index={index}
                  updateBlockProps={updateBlockProps}
                  uploadImage={uploadImage}
                />
              </div>
            ))}
          </SortableContext>
        </DndContext>
        {blocks.length === 0 && (
          <p className="text-xs text-slate-400">Add a block to start building.</p>
        )}
      </div>
    </div>
  );
}

function SortableBlock({
  block,
  onRemove,
}: {
  block: Block;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: block.uid });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="cursor-grab rounded-full bg-slate-100 px-3 py-1 text-xs"
            {...attributes}
            {...listeners}
          >
            Drag
          </button>
          <span className="text-sm font-semibold text-slate-700">
            {block.type}
          </span>
        </div>
        <button
          onClick={onRemove}
          className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-600"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
