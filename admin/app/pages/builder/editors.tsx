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
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Block } from "./types";
import { formatItems, parseItems, toLine } from "./utils";
import { resolveUploadUrl, backendBaseUrl } from "@/lib/urls";

type GalleryItem = {
  id: string;
  url: string;
  caption?: string;
};

type HeroImageItem = {
  id: string;
  image: string;
  title?: string;
  subtitle?: string;
};

type AchievementItem = {
  id: string;
  value: string;
  label: string;
  sublabel?: string;
  icon?: string;
};

type WhyChooseItem = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
};

type CoreServiceItem = {
  id: string;
  image?: string;
  icon?: string;
  title: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaHref?: string;
};

type OurServicesV2Item = {
  id: string;
  image: string;
  title: string;
  description?: string;
  ctaText?: string;
  ctaHref?: string;
};

type OurWorkItem = {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
};

type ServiceProcessItem = {
  id: string;
  step: string;
  title: string;
  subtitle?: string;
  description?: string;
};

type PortfolioItem = {
  id: string;
  image?: string;
  title: string;
  subtitle?: string;
  href?: string;
  newTab?: boolean;
};

type BranchItem = {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  services: string[];
  mapLabel?: string;
  mapHref?: string;
};

type VisionCard = {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  icon?: string;
};

type CoreValueItem = {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  icon?: string;
};

type WhyChooseV2Item = {
  id: string;
  text: string;
};

type WorkWithUsProps = {
  icon?: string;
  heading: string;
  subheading: string;
  backgroundColor?: string;
};

type FaqItem = {
  id: string;
  question: string;
  answer?: string;
};

type BenefitItem = {
  id: string;
  title: string;
  description: string;
  icon?: string;
};

type JobVacancy = {
  id: string;
  title: string;
  location: string;
  type: string;
  salary: string;
  applyLabel?: string;
  applyHref?: string;
  features: string[];
};

type ContactUsTextProps = {
  backgroundColor?: string;
  gradientColor?: string;
  heading: string;
  subheading?: string;
  description?: string;
};

type RequestQuotationProps = {
  backgroundColor?: string;
  heading: string;
  subheading?: string;
  nameLabel?: string;
  companyLabel?: string;
  emailLabel?: string;
  phoneLabel?: string;
  serviceLabel?: string;
  detailsLabel?: string;
  submitLabel?: string;
  submitNote?: string;
  successTitle?: string;
  successMessage?: string;
  services?: string[];
};

type ContactChannel = {
  id: string;
  title: string;
  subtitle?: string;
  primary: string;
  secondary?: string;
  note?: string;
  icon?: string;
};

type ContactChannelCta = {
  id: string;
  label: string;
  href: string;
  icon?: string;
};

const extractMapEmbedSrc = (value: string) => {
  const trimmed = value.trim();
  const match = trimmed.match(/<iframe[^>]*src=["']([^"']+)["']/i);
  return match ? match[1] : trimmed;
};

function SortableAchievementItem({
  item,
  onChange,
  onRemove,
  onUpload,
}: {
  item: AchievementItem;
  onChange: (patch: Partial<AchievementItem>) => void;
  onRemove: () => void;
  onUpload: (file: File) => Promise<string>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3"
    >
      <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white">
          {item.icon ? (
            <img
              src={item.icon}
              alt=""
              className="h-5 w-5 object-contain"
            />
          ) : (
            <span className="text-[10px] text-slate-400">Icon</span>
          )}
        </div>
        <div className="text-xs text-slate-600">
          <div className="font-semibold text-slate-800">
            {item.value || "Value"}
          </div>
          <div>{item.label || "Label"}</div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <button
          className="cursor-grab rounded-lg bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-xs font-semibold shadow-md transition-colors"
          {...attributes}
          {...listeners}
        >
          ⠿ Drag
        </button>
        <button
          onClick={onRemove}
          className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-600"
        >
          Delete
        </button>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <label className="grid gap-1">
          Value
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            value={item.value}
            onChange={(event) => onChange({ value: event.target.value })}
          />
        </label>
        <label className="grid gap-1">
          Label
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            value={item.label}
            onChange={(event) => onChange({ label: event.target.value })}
          />
        </label>
      </div>
      <label className="grid gap-1">
        Sublabel
        <input
          className="rounded-xl border border-slate-200 px-3 py-2"
          value={item.sublabel || ""}
          onChange={(event) => onChange({ sublabel: event.target.value })}
        />
      </label>
      <div className="grid gap-2 md:grid-cols-[1fr_auto]">
        <label className="grid gap-1">
          Icon URL
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            value={item.icon || ""}
            onChange={(event) => onChange({ icon: event.target.value })}
          />
        </label>
        <label className="grid gap-1">
          🎨 Upload New Icon
          <input
            type="file"
            accept="image/*"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const url = await onUpload(file);
              onChange({ icon: url });
            }}
          />
        </label>
      </div>
    </div>
  );
}

function SortableWhyChooseItem({
  item,
  onChange,
  onRemove,
  onUpload,
}: {
  item: WhyChooseItem;
  onChange: (patch: Partial<WhyChooseItem>) => void;
  onRemove: () => void;
  onUpload: (file: File) => Promise<string>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3"
    >
      <div className="flex items-center justify-between">
        <button
          className="cursor-grab rounded-lg bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-xs font-semibold shadow-md transition-colors"
          {...attributes}
          {...listeners}
        >
          ⠿ Drag
        </button>
        <button
          onClick={onRemove}
          className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-600"
        >
          Delete
        </button>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white">
          {item.icon ? (
            <img
              src={item.icon}
              alt=""
              className="h-5 w-5 object-contain"
            />
          ) : (
            <span className="text-[10px] text-slate-400">Icon</span>
          )}
        </div>
        <div className="text-xs text-slate-600">
          <div className="font-semibold text-slate-800">
            {item.title || "Title"}
          </div>
          <div>{item.subtitle || "Subtitle"}</div>
        </div>
      </div>
      <label className="grid gap-1">
        Title
        <input
          className="rounded-xl border border-slate-200 px-3 py-2"
          value={item.title}
          onChange={(event) => onChange({ title: event.target.value })}
        />
      </label>
      <label className="grid gap-1">
        Subtitle
        <input
          className="rounded-xl border border-slate-200 px-3 py-2"
          value={item.subtitle || ""}
          onChange={(event) => onChange({ subtitle: event.target.value })}
        />
      </label>
      <label className="grid gap-1">
        Description
        <textarea
          className="min-h-[80px] rounded-xl border border-slate-200 px-3 py-2"
          value={item.description || ""}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </label>
      <div className="grid gap-2 md:grid-cols-[1fr_auto]">
        <label className="grid gap-1">
          Icon URL
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            value={item.icon || ""}
            onChange={(event) => onChange({ icon: event.target.value })}
          />
        </label>
        <label className="grid gap-1">
          🎨 Upload New Icon
          <input
            type="file"
            accept="image/*"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const url = await onUpload(file);
              onChange({ icon: url });
            }}
          />
        </label>
      </div>
    </div>
  );
}

function AchievementItemsEditor({
  items,
  onChange,
  onUpload,
}: {
  items: Array<Record<string, string>>;
  onChange: (next: Array<Record<string, string>>) => void;
  onUpload: (file: File) => Promise<string>;
}) {
  const [list, setList] = useState<AchievementItem[]>([]);
  const listRef = useRef<AchievementItem[]>([]);
  const lastSerialized = useMemo(() => JSON.stringify(items || []), [items]);

  useEffect(() => {
    const idMap = new Map(
      listRef.current.map((item) => [item.value + item.label, item.id])
    );
    const next = (items || []).map((item) => ({
      id:
        idMap.get((item.value || "") + (item.label || "")) ||
        crypto.randomUUID(),
      value: item.value || "",
      label: item.label || "",
      sublabel: item.sublabel || "",
      icon: item.icon || "",
    }));
    setList(next);
  }, [lastSerialized, items]);

  useEffect(() => {
    listRef.current = list;
  }, [list]);

  const sync = (nextItems: AchievementItem[]) => {
    setList(nextItems);
    onChange(
      nextItems.map((item) => ({
        value: item.value,
        label: item.label,
        sublabel: item.sublabel || "",
        icon: item.icon || "",
      }))
    );
  };

  const sensors = useSensors(useSensor(PointerSensor));

  const onDragEnd = (event: DragEndEvent) => {
    if (!event.over) return;
    const oldIndex = list.findIndex((item) => item.id === event.active.id);
    const newIndex = list.findIndex((item) => item.id === event.over?.id);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    sync(arrayMove(list, oldIndex, newIndex));
  };

  return (
    <div className="mt-3 grid gap-3 text-xs text-slate-600">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={list.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-3">
            {list.map((item, index) => (
              <SortableAchievementItem
                key={item.id}
                item={item}
                onUpload={onUpload}
                onRemove={() => sync(list.filter((_, i) => i !== index))}
                onChange={(patch) =>
                  sync(
                    list.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, ...patch } : entry
                    )
                  )
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button
        onClick={() =>
          sync([
            ...list,
            {
              id: crypto.randomUUID(),
              value: "",
              label: "",
              sublabel: "",
              icon: "",
            },
          ])
        }
        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs"
      >
        + Add item
      </button>
      {list.length === 0 && (
        <p className="text-xs text-slate-400">No items yet.</p>
      )}
    </div>
  );
}

function WhyChooseItemsEditor({
  items,
  onChange,
  onUpload,
}: {
  items: Array<Record<string, string>>;
  onChange: (next: Array<Record<string, string>>) => void;
  onUpload: (file: File) => Promise<string>;
}) {
  const [list, setList] = useState<WhyChooseItem[]>([]);
  const listRef = useRef<WhyChooseItem[]>([]);
  const lastSerialized = useMemo(() => JSON.stringify(items || []), [items]);

  useEffect(() => {
    const idMap = new Map(
      listRef.current.map((item) => [item.title + item.subtitle, item.id])
    );
    const next = (items || []).map((item) => ({
      id:
        idMap.get((item.title || "") + (item.subtitle || "")) ||
        crypto.randomUUID(),
      title: item.title || "",
      subtitle: item.subtitle || "",
      description: item.description || "",
      icon: item.icon || "",
    }));
    setList(next);
  }, [lastSerialized, items]);

  useEffect(() => {
    listRef.current = list;
  }, [list]);

  const sync = (nextItems: WhyChooseItem[]) => {
    setList(nextItems);
    onChange(
      nextItems.map((item) => ({
        title: item.title,
        subtitle: item.subtitle || "",
        description: item.description || "",
        icon: item.icon || "",
      }))
    );
  };

  const sensors = useSensors(useSensor(PointerSensor));
  const onDragEnd = (event: DragEndEvent) => {
    if (!event.over) return;
    const oldIndex = list.findIndex((item) => item.id === event.active.id);
    const newIndex = list.findIndex((item) => item.id === event.over?.id);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    sync(arrayMove(list, oldIndex, newIndex));
  };

  return (
    <div className="mt-3 grid gap-3 text-xs text-slate-600">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={list.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-3">
            {list.map((item, index) => (
              <SortableWhyChooseItem
                key={item.id}
                item={item}
                onUpload={onUpload}
                onRemove={() => sync(list.filter((_, i) => i !== index))}
                onChange={(patch) =>
                  sync(
                    list.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, ...patch } : entry
                    )
                  )
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button
        onClick={() =>
          sync([
            ...list,
            {
              id: crypto.randomUUID(),
              title: "",
              subtitle: "",
              description: "",
              icon: "",
            },
          ])
        }
        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs"
      >
        + Add item
      </button>
      {list.length === 0 && (
        <p className="text-xs text-slate-400">No items yet.</p>
      )}
    </div>
  );
}

function SortableCoreServiceItem({
  item,
  onChange,
  onRemove,
  onUpload,
}: {
  item: CoreServiceItem;
  onChange: (patch: Partial<CoreServiceItem>) => void;
  onRemove: () => void;
  onUpload: (file: File) => Promise<string>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3"
    >
      <div className="flex items-center justify-between">
        <button
          className="cursor-grab rounded-lg bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-xs font-semibold shadow-md transition-colors"
          {...attributes}
          {...listeners}
        >
          ⠿ Drag
        </button>
        <button
          onClick={onRemove}
          className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-600"
        >
          Delete
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-[96px_1fr]">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {item.image ? (
            <img
              src={item.image}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-[10px] text-slate-400">Image</span>
          )}
        </div>
        <div className="grid gap-2">
          <label className="grid gap-1">
            Image URL
            <input
              className="rounded-xl border border-slate-200 px-3 py-2"
              value={item.image || ""}
              onChange={(event) => onChange({ image: event.target.value })}
            />
          </label>
          <label className="grid gap-1">
            Upload New Image
            <input
              type="file"
              accept="image/*"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const url = await onUpload(file);
                onChange({ image: url });
              }}
            />
          </label>
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <label className="grid gap-1">
          Title
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            value={item.title}
            onChange={(event) => onChange({ title: event.target.value })}
          />
        </label>
        <label className="grid gap-1">
          Subtitle
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            value={item.subtitle || ""}
            onChange={(event) => onChange({ subtitle: event.target.value })}
          />
        </label>
      </div>
      <label className="grid gap-1">
        Description
        <textarea
          className="min-h-[80px] rounded-xl border border-slate-200 px-3 py-2"
          value={item.description || ""}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </label>
      <div className="grid gap-2 md:grid-cols-[1fr_auto]">
        <label className="grid gap-1">
          Icon URL
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            value={item.icon || ""}
            onChange={(event) => onChange({ icon: event.target.value })}
          />
        </label>
        <label className="grid gap-1">
          🎨 Upload New Icon
          <input
            type="file"
            accept="image/*"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const url = await onUpload(file);
              onChange({ icon: url });
            }}
          />
        </label>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <label className="grid gap-1">
          CTA Text
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            value={item.ctaText || ""}
            onChange={(event) => onChange({ ctaText: event.target.value })}
          />
        </label>
        <label className="grid gap-1">
          CTA Link
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            value={item.ctaHref || ""}
            onChange={(event) => onChange({ ctaHref: event.target.value })}
          />
        </label>
      </div>
    </div>
  );
}

function CoreServicesEditor({
  items,
  onChange,
  onUpload,
}: {
  items: Array<Record<string, string>>;
  onChange: (next: Array<Record<string, string>>) => void;
  onUpload: (file: File) => Promise<string>;
}) {
  const [list, setList] = useState<CoreServiceItem[]>([]);
  const listRef = useRef<CoreServiceItem[]>([]);
  const lastSerialized = useMemo(() => JSON.stringify(items || []), [items]);

  useEffect(() => {
    const idMap = new Map(
      listRef.current.map((item) => [item.title + item.subtitle, item.id])
    );
    const next = (items || []).map((item) => ({
      id:
        idMap.get((item.title || "") + (item.subtitle || "")) ||
        crypto.randomUUID(),
      image: item.image || "",
      icon: item.icon || "",
      title: item.title || "",
      subtitle: item.subtitle || "",
      description: item.description || "",
      ctaText: item.ctaText || "",
      ctaHref: item.ctaHref || "",
    }));
    setList(next);
  }, [lastSerialized, items]);

  useEffect(() => {
    listRef.current = list;
  }, [list]);

  const sync = (nextItems: CoreServiceItem[]) => {
    setList(nextItems);
    onChange(
      nextItems.map((item) => ({
        image: item.image || "",
        icon: item.icon || "",
        title: item.title,
        subtitle: item.subtitle || "",
        description: item.description || "",
        ctaText: item.ctaText || "",
        ctaHref: item.ctaHref || "",
      }))
    );
  };

  const sensors = useSensors(useSensor(PointerSensor));
  const onDragEnd = (event: DragEndEvent) => {
    if (!event.over) return;
    const oldIndex = list.findIndex((item) => item.id === event.active.id);
    const newIndex = list.findIndex((item) => item.id === event.over?.id);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    sync(arrayMove(list, oldIndex, newIndex));
  };

  return (
    <div className="mt-3 grid gap-3 text-xs text-slate-600">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={list.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-3">
            {list.map((item, index) => (
              <SortableCoreServiceItem
                key={item.id}
                item={item}
                onUpload={onUpload}
                onRemove={() => sync(list.filter((_, i) => i !== index))}
                onChange={(patch) =>
                  sync(
                    list.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, ...patch } : entry
                    )
                  )
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button
        onClick={() =>
          sync([
            ...list,
            {
              id: crypto.randomUUID(),
              image: "",
              icon: "",
              title: "",
              subtitle: "",
              description: "",
              ctaText: "",
              ctaHref: "",
            },
          ])
        }
        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs"
      >
        + Add item
      </button>
      {list.length === 0 && (
        <p className="text-xs text-slate-400">No items yet.</p>
      )}
    </div>
  );
}

function SortableOurServicesV2Item({
  item,
  onChange,
  onRemove,
  onUpload,
}: {
  item: OurServicesV2Item;
  onChange: (patch: Partial<OurServicesV2Item>) => void;
  onRemove: () => void;
  onUpload: (file: File) => Promise<string>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <button
          className="cursor-grab rounded-full bg-slate-100 px-3 py-1 text-xs"
          {...attributes}
          {...listeners}
        >
          Drag
        </button>
        <button
          onClick={onRemove}
          className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-600"
        >
          Delete
        </button>
      </div>
      <div className="grid gap-2 text-xs text-slate-600">
        <label className="grid gap-1">
          Image URL
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            value={item.image}
            onChange={(event) => onChange({ image: event.target.value })}
          />
        </label>
        <label className="grid gap-1">
          Upload Image
          <input
            type="file"
            accept="image/*"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const url = await onUpload(file);
              onChange({ image: url });
            }}
          />
        </label>
        <label className="grid gap-1">
          Title
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            value={item.title}
            onChange={(event) => onChange({ title: event.target.value })}
          />
        </label>
        <label className="grid gap-1">
          Description
          <textarea
            className="min-h-[80px] rounded-xl border border-slate-200 px-3 py-2"
            value={item.description || ""}
            onChange={(event) => onChange({ description: event.target.value })}
          />
        </label>
        <div className="grid gap-2 md:grid-cols-2">
          <label className="grid gap-1">
            CTA Text
            <input
              className="rounded-xl border border-slate-200 px-3 py-2"
              value={item.ctaText || ""}
              onChange={(event) => onChange({ ctaText: event.target.value })}
            />
          </label>
          <label className="grid gap-1">
            CTA Link
            <input
              className="rounded-xl border border-slate-200 px-3 py-2"
              value={item.ctaHref || ""}
              onChange={(event) => onChange({ ctaHref: event.target.value })}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function OurServicesV2Editor({
  items,
  onChange,
  onUpload,
}: {
  items: Array<Record<string, string>>;
  onChange: (next: Array<Record<string, string>>) => void;
  onUpload: (file: File) => Promise<string>;
}) {
  const [list, setList] = useState<OurServicesV2Item[]>([]);
  const listRef = useRef<OurServicesV2Item[]>([]);
  const lastSerialized = useMemo(() => JSON.stringify(items || []), [items]);

  useEffect(() => {
    const idMap = new Map(
      listRef.current.map((item) => [item.title + item.image, item.id])
    );
    const next = (items || []).map((item) => ({
      id: idMap.get((item.title || "") + (item.image || "")) || crypto.randomUUID(),
      image: item.image || "",
      title: item.title || "",
      description: item.description || "",
      ctaText: item.ctaText || "",
      ctaHref: item.ctaHref || "",
    }));
    setList(next);
  }, [lastSerialized, items]);

  useEffect(() => {
    listRef.current = list;
  }, [list]);

  const sync = (nextItems: OurServicesV2Item[]) => {
    setList(nextItems);
    onChange(
      nextItems.map((item) => ({
        image: item.image || "",
        title: item.title,
        description: item.description || "",
        ctaText: item.ctaText || "",
        ctaHref: item.ctaHref || "",
      }))
    );
  };

  const sensors = useSensors(useSensor(PointerSensor));
  const onDragEnd = (event: DragEndEvent) => {
    if (!event.over) return;
    const oldIndex = list.findIndex((item) => item.id === event.active.id);
    const newIndex = list.findIndex((item) => item.id === event.over?.id);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    sync(arrayMove(list, oldIndex, newIndex));
  };

  return (
    <div className="mt-3 grid gap-3 text-xs text-slate-600">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={list.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-3">
            {list.map((item, index) => (
              <SortableOurServicesV2Item
                key={item.id}
                item={item}
                onUpload={onUpload}
                onRemove={() => sync(list.filter((_, i) => i !== index))}
                onChange={(patch) =>
                  sync(
                    list.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, ...patch } : entry
                    )
                  )
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button
        onClick={() =>
          sync([
            ...list,
            {
              id: crypto.randomUUID(),
              image: "",
              title: "",
              description: "",
              ctaText: "",
              ctaHref: "",
            },
          ])
        }
        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs"
      >
        + Add item
      </button>
      {list.length === 0 && (
        <p className="text-xs text-slate-400">No items yet.</p>
      )}
    </div>
  );
}

function SortableOurWorkItem({
  item,
  onChange,
  onRemove,
  onUpload,
}: {
  item: OurWorkItem;
  onChange: (patch: Partial<OurWorkItem>) => void;
  onRemove: () => void;
  onUpload: (file: File) => Promise<string>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <button
          className="cursor-grab rounded-full bg-slate-100 px-3 py-1 text-xs"
          {...attributes}
          {...listeners}
        >
          Drag
        </button>
        <button
          onClick={onRemove}
          className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-600"
        >
          Delete
        </button>
      </div>
      <div className="grid gap-2 text-xs text-slate-600">
        <label className="grid gap-1">
          Image URL
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            value={item.image}
            onChange={(event) => onChange({ image: event.target.value })}
          />
        </label>
        <label className="grid gap-1">
          Upload Image
          <input
            type="file"
            accept="image/*"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const url = await onUpload(file);
              onChange({ image: url });
            }}
          />
        </label>
        <label className="grid gap-1">
          Title
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            value={item.title}
            onChange={(event) => onChange({ title: event.target.value })}
          />
        </label>
        <label className="grid gap-1">
          Subtitle
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            value={item.subtitle || ""}
            onChange={(event) => onChange({ subtitle: event.target.value })}
          />
        </label>
      </div>
    </div>
  );
}

function OurWorkEditor({
  items,
  onChange,
  onUpload,
}: {
  items: Array<Record<string, string>>;
  onChange: (next: Array<Record<string, string>>) => void;
  onUpload: (file: File) => Promise<string>;
}) {
  const [list, setList] = useState<OurWorkItem[]>([]);
  const listRef = useRef<OurWorkItem[]>([]);
  const lastSerialized = useMemo(() => JSON.stringify(items || []), [items]);

  useEffect(() => {
    const idMap = new Map(
      listRef.current.map((item) => [item.title + item.image, item.id])
    );
    const next = (items || []).map((item) => ({
      id: idMap.get((item.title || "") + (item.image || "")) || crypto.randomUUID(),
      image: item.image || "",
      title: item.title || "",
      subtitle: item.subtitle || "",
    }));
    setList(next);
  }, [lastSerialized, items]);

  useEffect(() => {
    listRef.current = list;
  }, [list]);

  const sync = (nextItems: OurWorkItem[]) => {
    setList(nextItems);
    onChange(
      nextItems.map((item) => ({
        image: item.image || "",
        title: item.title,
        subtitle: item.subtitle || "",
      }))
    );
  };

  const sensors = useSensors(useSensor(PointerSensor));
  const onDragEnd = (event: DragEndEvent) => {
    if (!event.over) return;
    const oldIndex = list.findIndex((item) => item.id === event.active.id);
    const newIndex = list.findIndex((item) => item.id === event.over?.id);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    sync(arrayMove(list, oldIndex, newIndex));
  };

  return (
    <div className="mt-3 grid gap-3 text-xs text-slate-600">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={list.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-3">
            {list.map((item, index) => (
              <SortableOurWorkItem
                key={item.id}
                item={item}
                onUpload={onUpload}
                onRemove={() => sync(list.filter((_, i) => i !== index))}
                onChange={(patch) =>
                  sync(
                    list.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, ...patch } : entry
                    )
                  )
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button
        onClick={() =>
          sync([
            ...list,
            { id: crypto.randomUUID(), image: "", title: "", subtitle: "" },
          ])
        }
        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs"
      >
        + Add item
      </button>
      {list.length === 0 && (
        <p className="text-xs text-slate-400">No items yet.</p>
      )}
    </div>
  );
}

function SortableFaqItem({
  item,
  onChange,
  onRemove,
}: {
  item: FaqItem;
  onChange: (patch: Partial<FaqItem>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <button
          className="cursor-grab rounded-full bg-slate-100 px-3 py-1 text-xs"
          {...attributes}
          {...listeners}
        >
          Drag
        </button>
        <button
          onClick={onRemove}
          className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-600"
        >
          Delete
        </button>
      </div>
      <div className="grid gap-2 text-xs text-slate-600">
        <label className="grid gap-1">
          Question
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            value={item.question}
            onChange={(event) => onChange({ question: event.target.value })}
          />
        </label>
        <label className="grid gap-1">
          Answer
          <textarea
            className="min-h-[90px] rounded-xl border border-slate-200 px-3 py-2"
            value={item.answer || ""}
            onChange={(event) => onChange({ answer: event.target.value })}
          />
        </label>
      </div>
    </div>
  );
}

function FrequentlyAskedQuestionsEditor({
  items,
  onChange,
}: {
  items: Array<Record<string, string>>;
  onChange: (next: Array<Record<string, string>>) => void;
}) {
  const [list, setList] = useState<FaqItem[]>([]);
  const listRef = useRef<FaqItem[]>([]);
  const lastSerialized = useMemo(() => JSON.stringify(items || []), [items]);

  useEffect(() => {
    const idMap = new Map(
      listRef.current.map((item) => [item.question + item.answer, item.id])
    );
    const next = (items || []).map((item) => ({
      id:
        idMap.get((item.question || "") + (item.answer || "")) ||
        crypto.randomUUID(),
      question: item.question || "",
      answer: item.answer || "",
    }));
    setList(next);
  }, [lastSerialized, items]);

  useEffect(() => {
    listRef.current = list;
  }, [list]);

  const sync = (nextItems: FaqItem[]) => {
    setList(nextItems);
    onChange(
      nextItems.map((item) => ({
        question: item.question,
        answer: item.answer || "",
      }))
    );
  };

  const sensors = useSensors(useSensor(PointerSensor));
  const onDragEnd = (event: DragEndEvent) => {
    if (!event.over) return;
    const oldIndex = list.findIndex((item) => item.id === event.active.id);
    const newIndex = list.findIndex((item) => item.id === event.over?.id);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    sync(arrayMove(list, oldIndex, newIndex));
  };

  return (
    <div className="mt-3 grid gap-3 text-xs text-slate-600">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={list.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-3">
            {list.map((item, index) => (
              <SortableFaqItem
                key={item.id}
                item={item}
                onRemove={() => sync(list.filter((_, i) => i !== index))}
                onChange={(patch) =>
                  sync(
                    list.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, ...patch } : entry
                    )
                  )
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button
        onClick={() =>
          sync([
            ...list,
            { id: crypto.randomUUID(), question: "", answer: "" },
          ])
        }
        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs"
      >
        + Add item
      </button>
      {list.length === 0 && (
        <p className="text-xs text-slate-400">No items yet.</p>
      )}
    </div>
  );
}

function SortableServiceProcessItem({
  item,
  onChange,
  onRemove,
}: {
  item: ServiceProcessItem;
  onChange: (patch: Partial<ServiceProcessItem>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3"
    >
      <div className="flex items-center justify-between">
        <button
          className="cursor-grab rounded-lg bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-xs font-semibold shadow-md transition-colors"
          {...attributes}
          {...listeners}
        >
          ⠿ Drag
        </button>
        <button
          onClick={onRemove}
          className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-600"
        >
          Delete
        </button>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        <label className="grid gap-1">
          Step
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            value={item.step}
            onChange={(event) => onChange({ step: event.target.value })}
          />
        </label>
        <label className="grid gap-1 md:col-span-2">
          Title
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            value={item.title}
            onChange={(event) => onChange({ title: event.target.value })}
          />
        </label>
      </div>
      <label className="grid gap-1">
        Subtitle
        <input
          className="rounded-xl border border-slate-200 px-3 py-2"
          value={item.subtitle || ""}
          onChange={(event) => onChange({ subtitle: event.target.value })}
        />
      </label>
      <label className="grid gap-1">
        Description
        <textarea
          className="min-h-[72px] rounded-xl border border-slate-200 px-3 py-2"
          value={item.description || ""}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </label>
    </div>
  );
}

function ServiceProcessEditor({
  items,
  onChange,
}: {
  items: Array<Record<string, string>>;
  onChange: (next: Array<Record<string, string>>) => void;
}) {
  const [list, setList] = useState<ServiceProcessItem[]>([]);
  const listRef = useRef<ServiceProcessItem[]>([]);
  const lastSerialized = useMemo(() => JSON.stringify(items || []), [items]);

  useEffect(() => {
    const idMap = new Map(
      listRef.current.map((item) => [item.step + item.title, item.id])
    );
    const next = (items || []).map((item) => ({
      id:
        idMap.get((item.step || "") + (item.title || "")) ||
        crypto.randomUUID(),
      step: item.step || "",
      title: item.title || "",
      subtitle: item.subtitle || "",
      description: item.description || "",
    }));
    setList(next);
  }, [lastSerialized, items]);

  useEffect(() => {
    listRef.current = list;
  }, [list]);

  const sync = (nextItems: ServiceProcessItem[]) => {
    setList(nextItems);
    onChange(
      nextItems.map((item) => ({
        step: item.step,
        title: item.title,
        subtitle: item.subtitle || "",
        description: item.description || "",
      }))
    );
  };

  const sensors = useSensors(useSensor(PointerSensor));
  const onDragEnd = (event: DragEndEvent) => {
    if (!event.over) return;
    const oldIndex = list.findIndex((item) => item.id === event.active.id);
    const newIndex = list.findIndex((item) => item.id === event.over?.id);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    sync(arrayMove(list, oldIndex, newIndex));
  };

  return (
    <div className="mt-3 grid gap-3 text-xs text-slate-600">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={list.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-3">
            {list.map((item, index) => (
              <SortableServiceProcessItem
                key={item.id}
                item={item}
                onRemove={() => sync(list.filter((_, i) => i !== index))}
                onChange={(patch) =>
                  sync(
                    list.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, ...patch } : entry
                    )
                  )
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button
        onClick={() =>
          sync([
            ...list,
            {
              id: crypto.randomUUID(),
              step: String(list.length + 1).padStart(2, "0"),
              title: "",
              subtitle: "",
              description: "",
            },
          ])
        }
        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs"
      >
        + Add step
      </button>
      {list.length === 0 && (
        <p className="text-xs text-slate-400">No steps yet.</p>
      )}
    </div>
  );
}

function SortablePortfolioItem({
  item,
  onChange,
  onRemove,
  onUpload,
}: {
  item: PortfolioItem;
  onChange: (patch: Partial<PortfolioItem>) => void;
  onRemove: () => void;
  onUpload: (file: File) => Promise<string>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3"
    >
      <div className="flex items-center justify-between">
        <button
          className="cursor-grab rounded-lg bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-xs font-semibold shadow-md transition-colors"
          {...attributes}
          {...listeners}
        >
          ⠿ Drag
        </button>
        <button
          onClick={onRemove}
          className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-600"
        >
          Delete
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-[120px_1fr]">
        <div className="flex h-24 w-28 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {item.image ? (
            <img
              src={item.image}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-[10px] text-slate-400">Image</span>
          )}
        </div>
        <div className="grid gap-2">
          <label className="grid gap-1">
            Image URL
            <input
              className="rounded-xl border border-slate-200 px-3 py-2"
              value={item.image || ""}
              onChange={(event) => onChange({ image: event.target.value })}
            />
          </label>
          <label className="grid gap-1">
            📤 Upload New Image
            <input
              type="file"
              accept="image/*"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const url = await onUpload(file);
                onChange({ image: url });
              }}
            />
          </label>
        </div>
      </div>
      <label className="grid gap-1">
        Title
        <input
          className="rounded-xl border border-slate-200 px-3 py-2"
          value={item.title}
          onChange={(event) => onChange({ title: event.target.value })}
        />
      </label>
      <label className="grid gap-1">
        Subtitle
        <input
          className="rounded-xl border border-slate-200 px-3 py-2"
          value={item.subtitle || ""}
          onChange={(event) => onChange({ subtitle: event.target.value })}
        />
      </label>
      <label className="grid gap-1">
        Link
        <input
          className="rounded-xl border border-slate-200 px-3 py-2"
          value={item.href || ""}
          onChange={(event) => onChange({ href: event.target.value })}
        />
      </label>
      <label className="flex items-center gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={Boolean(item.newTab)}
          onChange={(event) => onChange({ newTab: event.target.checked })}
        />
        Open in new tab
      </label>
    </div>
  );
}

function PortfolioEditor({
  items,
  onChange,
  onUpload,
}: {
  items: Array<Record<string, any>>;
  onChange: (next: Array<Record<string, any>>) => void;
  onUpload: (file: File) => Promise<string>;
}) {
  const [list, setList] = useState<PortfolioItem[]>([]);
  const listRef = useRef<PortfolioItem[]>([]);
  const lastSerialized = useMemo(() => JSON.stringify(items || []), [items]);

  useEffect(() => {
    const idMap = new Map(
      listRef.current.map((item) => [item.title + item.subtitle, item.id])
    );
    const next = (items || []).map((item) => ({
      id:
        idMap.get((item.title || "") + (item.subtitle || "")) ||
        crypto.randomUUID(),
      image: item.image || "",
      title: item.title || "",
      subtitle: item.subtitle || "",
      href: item.href || "",
      newTab: Boolean(item.newTab),
    }));
    setList(next);
  }, [lastSerialized, items]);

  useEffect(() => {
    listRef.current = list;
  }, [list]);

  const sync = (nextItems: PortfolioItem[]) => {
    setList(nextItems);
    onChange(
      nextItems.map((item) => ({
        image: item.image || "",
        title: item.title,
        subtitle: item.subtitle || "",
        href: item.href || "",
        newTab: Boolean(item.newTab),
      }))
    );
  };

  const sensors = useSensors(useSensor(PointerSensor));
  const onDragEnd = (event: DragEndEvent) => {
    if (!event.over) return;
    const oldIndex = list.findIndex((item) => item.id === event.active.id);
    const newIndex = list.findIndex((item) => item.id === event.over?.id);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    sync(arrayMove(list, oldIndex, newIndex));
  };

  return (
    <div className="mt-3 grid gap-3 text-xs text-slate-600">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={list.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-3">
            {list.map((item, index) => (
              <SortablePortfolioItem
                key={item.id}
                item={item}
                onUpload={onUpload}
                onRemove={() => sync(list.filter((_, i) => i !== index))}
                onChange={(patch) =>
                  sync(
                    list.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, ...patch } : entry
                    )
                  )
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button
        onClick={() =>
          sync([
            ...list,
            {
              id: crypto.randomUUID(),
              image: "",
              title: "",
              subtitle: "",
              href: "",
              newTab: false,
            },
          ])
        }
        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs"
      >
        + Add item
      </button>
      {list.length === 0 && (
        <p className="text-xs text-slate-400">No items yet.</p>
      )}
    </div>
  );
}

function SortableGalleryItem({
  item,
  onRemove,
  onChange,
}: {
  item: GalleryItem;
  onRemove: () => void;
  onChange: (patch: Partial<GalleryItem>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
    >
      <button
        className="cursor-grab rounded-lg bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-xs font-semibold shadow-md transition-colors"
        {...attributes}
        {...listeners}
      >
        ⠿ Drag
      </button>
      <img
        src={item.url || "https://via.placeholder.com/80"}
        alt={item.caption || "gallery"}
        className="h-14 w-20 rounded-lg object-cover"
      />
      <div className="flex-1 grid gap-2 text-xs text-slate-600">
        <input
          type="hidden"
          value={item.url}
          onChange={(event) => onChange({ url: event.target.value })}
        />
        <input
          className="rounded-xl border border-slate-200 px-3 py-2"
          value={item.caption || ""}
          onChange={(event) => onChange({ caption: event.target.value })}
          placeholder="Caption"
        />
      </div>
      <button
        onClick={onRemove}
        className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-600"
      >
        Delete
      </button>
    </div>
  );
}

function GalleryEditor({
  images,
  onChange,
  onUpload,
}: {
  images: Array<Record<string, string>>;
  onChange: (next: Array<Record<string, string>>) => void;
  onUpload: (file: File) => Promise<string>;
}) {
  const sensors = useSensors(useSensor(PointerSensor));
  const [items, setItems] = useState<GalleryItem[]>([]);
  const itemsRef = useRef<GalleryItem[]>([]);
  const lastSerialized = useMemo(() => JSON.stringify(images || []), [images]);

  useEffect(() => {
    const idMap = new Map(itemsRef.current.map((item) => [item.url, item.id]));
    const next = (images || []).map((item) => ({
      id: idMap.get(item.url || "") || crypto.randomUUID(),
      url: item.url || "",
      caption: item.caption || "",
    }));
    setItems(next);
  }, [lastSerialized, images]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const sync = (nextItems: GalleryItem[]) => {
    setItems(nextItems);
    onChange(
      nextItems.map((item) => ({ url: item.url, caption: item.caption || "" }))
    );
  };

  const handleUpload = async (file: File) => {
    const url = await onUpload(file);
    const nextItems = [...items, { id: crypto.randomUUID(), url, caption: "" }];
    sync(nextItems);
  };

  const onDragEnd = (event: DragEndEvent) => {
    if (!event.over) return;
    const oldIndex = items.findIndex((item) => item.id === event.active.id);
    const newIndex = items.findIndex((item) => item.id === event.over?.id);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    sync(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <div className="mt-3 grid gap-3 text-xs text-slate-600">
      <label className="grid gap-1">
        📤 Upload New Image
        <input
          type="file"
          accept="image/*"
          className="rounded-xl border border-slate-200 px-3 py-2"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            handleUpload(file);
          }}
        />
      </label>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-3">
            {items.map((item) => (
              <SortableGalleryItem
                key={item.id}
                item={item}
                onRemove={() => sync(items.filter((entry) => entry.id !== item.id))}
                onChange={(patch) =>
                  sync(
                    items.map((entry) =>
                      entry.id === item.id ? { ...entry, ...patch } : entry
                    )
                  )
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {items.length === 0 && (
        <p className="text-xs text-slate-400">No images yet.</p>
      )}
    </div>
  );
}

function SortableHeroImageItem({
  item,
  onRemove,
  onChange,
}: {
  item: HeroImageItem;
  onRemove: () => void;
  onChange: (patch: Partial<HeroImageItem>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
    >
      <button
        className="cursor-grab rounded-lg bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-xs font-semibold shadow-md transition-colors"
        {...attributes}
        {...listeners}
      >
        ⠿ Drag
      </button>
      <img
        src={item.image || "https://via.placeholder.com/80"}
        alt={item.title || "slide"}
        className="h-14 w-20 rounded-lg object-cover"
      />
      <div className="flex-1 grid gap-2 text-xs text-slate-600">
        <input
          type="hidden"
          value={item.image}
          onChange={(event) => onChange({ image: event.target.value })}
        />
        <input
          className="rounded-xl border border-slate-200 px-3 py-2"
          value={item.title || ""}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder="Title"
        />
        <input
          className="rounded-xl border border-slate-200 px-3 py-2"
          value={item.subtitle || ""}
          onChange={(event) => onChange({ subtitle: event.target.value })}
          placeholder="Subtitle"
        />
      </div>
      <button
        onClick={onRemove}
        className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-600"
      >
        Delete
      </button>
    </div>
  );
}

function HeroImagesEditor({
  images,
  onChange,
  onUpload,
}: {
  images: Array<Record<string, string>>;
  onChange: (next: Array<Record<string, string>>) => void;
  onUpload: (file: File) => Promise<string>;
}) {
  const sensors = useSensors(useSensor(PointerSensor));
  const [items, setItems] = useState<HeroImageItem[]>([]);
  const itemsRef = useRef<HeroImageItem[]>([]);
  const lastSerialized = useMemo(() => JSON.stringify(images || []), [images]);

  useEffect(() => {
    const idMap = new Map(itemsRef.current.map((item) => [item.image, item.id]));
    const next = (images || []).map((item) => ({
      id: idMap.get(item.image || "") || crypto.randomUUID(),
      image: item.image || "",
      title: item.title || "",
      subtitle: item.subtitle || "",
    }));
    setItems(next);
  }, [lastSerialized, images]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const sync = (nextItems: HeroImageItem[]) => {
    setItems(nextItems);
    onChange(
      nextItems.map((item) => ({
        image: item.image,
        title: item.title || "",
        subtitle: item.subtitle || "",
      }))
    );
  };

  const handleUpload = async (file: File) => {
    const url = await onUpload(file);
    const nextItems = [
      ...items,
      { id: crypto.randomUUID(), image: url, title: "", subtitle: "" },
    ];
    sync(nextItems);
  };

  const onDragEnd = (event: DragEndEvent) => {
    if (!event.over) return;
    const oldIndex = items.findIndex((item) => item.id === event.active.id);
    const newIndex = items.findIndex((item) => item.id === event.over?.id);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    sync(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <div className="mt-3 grid gap-3 text-xs text-slate-600">
      <label className="grid gap-1">
        📤 Upload New Image
        <input
          type="file"
          accept="image/*"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            handleUpload(file);
          }}
        />
      </label>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-3">
            {items.map((item) => (
              <SortableHeroImageItem
                key={item.id}
                item={item}
                onRemove={() =>
                  sync(items.filter((entry) => entry.id !== item.id))
                }
                onChange={(patch) =>
                  sync(
                    items.map((entry) =>
                      entry.id === item.id ? { ...entry, ...patch } : entry
                    )
                  )
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {items.length === 0 && (
        <p className="text-xs text-slate-400">No hero images yet.</p>
      )}
    </div>
  );
}

type SelectedProduct = {
  id: string;
  name: string;
  slug: string;
  image?: string;
};

type AvailableProduct = {
  id: string;
  name: string;
  slug: string;
  images?: string[];
};

function ProductSelector({
  selectedProducts,
  onChange,
}: {
  selectedProducts: SelectedProduct[];
  onChange: (products: SelectedProduct[]) => void;
}) {
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${backendBaseUrl}/products?status=published`);
        if (response.ok) {
          const data = await response.json();
          setAvailableProducts(data.products || []);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = availableProducts.filter((p) => {
    const name = typeof p.name === "string" ? p.name : (p.name as any)?.th || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const isSelected = (productId: string) =>
    selectedProducts.some((p) => p.id === productId);

  const handleSelect = (product: AvailableProduct) => {
    if (isSelected(product.id)) {
      onChange(selectedProducts.filter((p) => p.id !== product.id));
    } else {
      const name = typeof product.name === "string" ? product.name : (product.name as any)?.th || "";
      onChange([
        ...selectedProducts,
        {
          id: product.id,
          name,
          slug: product.slug,
          image: product.images?.[0] || "",
        },
      ]);
    }
  };

  const handleRemove = (productId: string) => {
    onChange(selectedProducts.filter((p) => p.id !== productId));
  };

  const moveProduct = (fromIndex: number, toIndex: number) => {
    const newProducts = [...selectedProducts];
    const [movedProduct] = newProducts.splice(fromIndex, 1);
    newProducts.splice(toIndex, 0, movedProduct);
    onChange(newProducts);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
        กำลังโหลดสินค้า...
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {/* Selected Products */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-slate-700">
          สินค้าที่เลือก ({selectedProducts.length} รายการ)
        </label>
        {selectedProducts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-400">
            ยังไม่ได้เลือกสินค้า - เลือกจากรายการด้านล่าง
          </div>
        ) : (
          <div className="grid gap-2">
            {selectedProducts.map((product, idx) => (
              <div
                key={product.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#8b1538] text-xs font-bold" style={{ color: "#ffffff" }}>
                  {idx + 1}
                </span>
                {product.image && (
                  <img
                    src={resolveUploadUrl(product.image)}
                    alt=""
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                )}
                <span className="flex-1 text-xs font-medium text-slate-700 truncate">
                  {product.name}
                </span>
                <div className="flex items-center gap-1">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => moveProduct(idx, idx - 1)}
                      className="rounded-lg bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200"
                    >
                      ↑
                    </button>
                  )}
                  {idx < selectedProducts.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveProduct(idx, idx + 1)}
                      className="rounded-lg bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200"
                    >
                      ↓
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(product.id)}
                    className="rounded-lg bg-rose-50 px-2 py-1 text-xs text-rose-600 hover:bg-rose-100"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Search & Selection */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-slate-700">
          เลือกสินค้าเพิ่ม
        </label>
        <input
          type="text"
          placeholder="ค้นหาสินค้า..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
        />
        <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white">
          {filteredProducts.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400">
              ไม่พบสินค้า
            </div>
          ) : (
            filteredProducts.map((product) => {
              const name = typeof product.name === "string" ? product.name : (product.name as any)?.th || "";
              const selected = isSelected(product.id);
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleSelect(product)}
                  className={`flex w-full items-center gap-3 border-b border-slate-100 p-2 text-left transition last:border-0 ${
                    selected
                      ? "bg-[#8b1538]/10"
                      : "hover:bg-slate-50"
                  }`}
                >
                  {product.images?.[0] && (
                    <img
                      src={resolveUploadUrl(product.images[0])}
                      alt=""
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                  )}
                  <span className="flex-1 text-xs text-slate-700 truncate">
                    {name}
                  </span>
                  {selected && (
                    <span className="rounded-full bg-[#8b1538] px-2 py-0.5 text-[10px] font-semibold" style={{ color: "#ffffff" }}>
                      เลือกแล้ว
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

type SelectedCategory = {
  id: string;
  name: string;
  slug: string;
  logo?: string;
};

type AvailableCategory = {
  id: string;
  name: string;
  slug: string;
  logo?: string;
};

function CategorySelector({
  selectedCategories,
  onChange,
}: {
  selectedCategories: SelectedCategory[];
  onChange: (categories: SelectedCategory[]) => void;
}) {
  const [availableCategories, setAvailableCategories] = useState<AvailableCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${backendBaseUrl}/product-categories`);
        if (response.ok) {
          const data = await response.json();
          setAvailableCategories(data.categories || []);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const filteredCategories = availableCategories.filter((c) => {
    const name = typeof c.name === "string" ? c.name : "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const isSelected = (categoryId: string) =>
    selectedCategories.some((c) => c.id === categoryId);

  const handleSelect = (category: AvailableCategory) => {
    if (isSelected(category.id)) {
      onChange(selectedCategories.filter((c) => c.id !== category.id));
    } else {
      onChange([
        ...selectedCategories,
        {
          id: category.id,
          name: category.name,
          slug: category.slug,
          logo: category.logo || "",
        },
      ]);
    }
  };

  const handleRemove = (categoryId: string) => {
    onChange(selectedCategories.filter((c) => c.id !== categoryId));
  };

  const moveCategory = (fromIndex: number, toIndex: number) => {
    const newCategories = [...selectedCategories];
    const [movedCategory] = newCategories.splice(fromIndex, 1);
    newCategories.splice(toIndex, 0, movedCategory);
    onChange(newCategories);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
        กำลังโหลดหมวดหมู่...
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {/* Selected Categories */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-slate-700">
          หมวดหมู่ที่เลือก ({selectedCategories.length} รายการ)
        </label>
        {selectedCategories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-400">
            ยังไม่ได้เลือกหมวดหมู่ - เลือกจากรายการด้านล่าง
          </div>
        ) : (
          <div className="grid gap-2">
            {selectedCategories.map((category, idx) => (
              <div
                key={category.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#8b1538] text-xs font-bold" style={{ color: "#ffffff" }}>
                  {idx + 1}
                </span>
                {category.logo && (
                  <img
                    src={resolveUploadUrl(category.logo)}
                    alt=""
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                )}
                <span className="flex-1 text-xs font-medium text-slate-700 truncate">
                  {category.name}
                </span>
                <div className="flex items-center gap-1">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => moveCategory(idx, idx - 1)}
                      className="rounded-lg bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200"
                    >
                      ↑
                    </button>
                  )}
                  {idx < selectedCategories.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveCategory(idx, idx + 1)}
                      className="rounded-lg bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200"
                    >
                      ↓
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(category.id)}
                    className="rounded-lg bg-rose-50 px-2 py-1 text-xs text-rose-600 hover:bg-rose-100"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Search & Selection */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-slate-700">
          เลือกหมวดหมู่เพิ่ม
        </label>
        <input
          type="text"
          placeholder="ค้นหาหมวดหมู่..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
        />
        <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white">
          {filteredCategories.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400">
              ไม่พบหมวดหมู่
            </div>
          ) : (
            filteredCategories.map((category) => {
              const selected = isSelected(category.id);
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleSelect(category)}
                  className={`flex w-full items-center gap-3 border-b border-slate-100 p-2 text-left transition last:border-0 ${
                    selected
                      ? "bg-[#8b1538]/10"
                      : "hover:bg-slate-50"
                  }`}
                >
                  {category.logo && (
                    <img
                      src={resolveUploadUrl(category.logo)}
                      alt=""
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                  )}
                  <span className="flex-1 text-xs text-slate-700 truncate">
                    {category.name}
                  </span>
                  {selected && (
                    <span className="rounded-full bg-[#8b1538] px-2 py-0.5 text-[10px] font-semibold" style={{ color: "#ffffff" }}>
                      เลือกแล้ว
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

type BlockEditorProps = {
  block: Block;
  index: number;
  updateBlockProps: (index: number, patch: Record<string, unknown>) => void;
  uploadImage: (file: File) => Promise<string>;
};

type ImageUploaderProps = {
  value?: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
};

function ImageUploader({ value, onChange, onUpload }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await onUpload(file);
      onChange(url);
    } finally {
      setUploading(false);
    }
  };

  const previewUrl = value ? resolveUploadUrl(String(value)) : "";

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      {previewUrl ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <img
            src={previewUrl}
            alt="Background preview"
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-full bg-rose-600 p-1.5 text-white shadow hover:bg-rose-700 transition"
            title="Remove image"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white text-slate-400">
          <svg className="h-8 w-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs">No image selected</span>
        </div>
      )}

      <div className="grid gap-2">
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
          placeholder="Image URL..."
          defaultValue={toLine(value as string)}
          onBlur={(event) => onChange(event.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
            onChange={(event) => handleFileUpload(event.target.files?.[0])}
            disabled={uploading}
          />
          {uploading && (
            <span className="text-[11px] text-slate-500">Uploading...</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function BlockEditor({
  block,
  index,
  updateBlockProps,
  uploadImage,
}: BlockEditorProps) {
  if (!block) return null;
  const props = block.props as Record<string, unknown>;

  if (block.type === "hero") {
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        {[
          ["title", "Title"],
          ["subtitle", "Subtitle"],
          ["description", "Description"],
          ["primaryCtaText", "Primary CTA Text"],
          ["primaryCtaHref", "Primary CTA Link"],
          ["secondaryCtaText", "Secondary CTA Text"],
          ["secondaryCtaHref", "Secondary CTA Link"],
        ].map(([key, label]) => (
          <label key={key} className="grid gap-1">
            {label}
            <input
              className="rounded-xl border border-slate-200 px-3 py-2"
              defaultValue={toLine(props[key as string] as string)}
              onBlur={(event) =>
                updateBlockProps(index, { [key]: event.target.value })
              }
            />
          </label>
        ))}
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#ffffff"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Hero Image
          <input
            type="file"
            accept="image/*"
            className="rounded-xl border border-slate-200 px-3 py-2"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const url = await uploadImage(file);
              updateBlockProps(index, { backgroundImage: url });
            }}
          />
        </label>
        {props.backgroundImage ? (
          <div className="grid gap-2">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <img
                src={resolveUploadUrl(String(props.backgroundImage))}
                alt="Hero preview"
                className="h-36 w-full object-cover"
              />
            </div>
            <button
              type="button"
              className="w-fit rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-600"
              onClick={() => updateBlockProps(index, { backgroundImage: "" })}
            >
              Remove hero image
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400">No hero image yet.</p>
        )}
      </div>
    );
  }

  if (block.type === "hero-images") {
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#ffffff"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        <HeroImagesEditor
          images={(props.images as Array<Record<string, string>>) || []}
          onUpload={uploadImage}
          onChange={(next) => updateBlockProps(index, { images: next })}
        />
      </div>
    );
  }

  if (block.type === "hero-with-available-rooms-check") {
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        {[
          ["title", "Title"],
          ["subtitle", "Subtitle"],
          ["description", "Description"],
          ["overlayTitle", "Overlay Title"],
          ["overlayButtonText", "Overlay Button Text"],
        ].map(([key, label]) => (
          <label key={key} className="grid gap-1">
            {label}
            <input
              className="rounded-xl border border-slate-200 px-3 py-2"
              defaultValue={toLine(props[key as string] as string)}
              onBlur={(event) =>
                updateBlockProps(index, { [key]: event.target.value })
              }
            />
          </label>
        ))}
        <label className="grid gap-1">
          Background Image
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            {props.backgroundImage ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <img
                  src={resolveUploadUrl(props.backgroundImage as string)}
                  alt="Background"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateBlockProps(index, { backgroundImage: "" })
                  }
                  className="absolute right-2 top-2 rounded-full bg-rose-600 p-1.5 text-white shadow hover:bg-rose-700 transition"
                  title="Remove image"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white text-slate-400">
                <svg className="h-8 w-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs">No image selected</span>
              </div>
            )}

            <div className="grid gap-2">
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                placeholder="Image URL..."
                value={props.backgroundImage as string || ""}
                onChange={(event) =>
                  updateBlockProps(index, { backgroundImage: event.target.value })
                }
              />
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file);
                    updateBlockProps(index, { backgroundImage: url });
                  }}
                />
                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-white border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 button">
                  <span>📂 Classification/Click to upload</span>
                </button>
              </div>
            </div>
          </div>
        </label>
        <label className="grid gap-1">
          Title Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.titleColor as string) || "#ffffff"}
            onChange={(event) =>
              updateBlockProps(index, { titleColor: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Subtitle Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.subtitleColor as string) || "#cbd5f5"}
            onChange={(event) =>
              updateBlockProps(index, { subtitleColor: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Description Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.descriptionColor as string) || "#e2e8f0"}
            onChange={(event) =>
              updateBlockProps(index, { descriptionColor: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Button Background
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.buttonBackground as string) || "#2563eb"}
            onChange={(event) =>
              updateBlockProps(index, { buttonBackground: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Button Text Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.buttonTextColor as string) || "#ffffff"}
            onChange={(event) =>
              updateBlockProps(index, { buttonTextColor: event.target.value })
            }
          />
        </label>
      </div>
    );
  }

  if (block.type === "contact-and-services") {
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#052a5f"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        {[
          ["heading", "Heading"],
          ["subheading", "Subheading"],
          ["badges", "Badges (use •)"],
          ["primaryCtaText", "Primary CTA Text"],
          ["primaryCtaHref", "Primary CTA Link"],
          ["secondaryCtaText", "Secondary CTA Text"],
          ["secondaryCtaHref", "Secondary CTA Link"],
        ].map(([key, label]) => (
          <label key={key} className="grid gap-1">
            {label}
            <textarea
              className="min-h-[56px] rounded-xl border border-slate-200 px-3 py-2"
              defaultValue={toLine(props[key as string] as string)}
              onBlur={(event) =>
                updateBlockProps(index, { [key]: event.target.value })
              }
            />
          </label>
        ))}
      </div>
    );
  }

  if (block.type === "achievement-expreience") {
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#052a5f"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        <AchievementItemsEditor
          items={(props.items as Array<Record<string, string>>) || []}
          onUpload={uploadImage}
          onChange={(next) => updateBlockProps(index, { items: next })}
        />
      </div>
    );
  }

  if (block.type === "why-choose-us") {
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#fff78a"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        {[
          ["heading", "Heading"],
          ["subheading", "Subheading"],
        ].map(([key, label]) => (
          <label key={key} className="grid gap-1">
            {label}
            <input
              className="rounded-xl border border-slate-200 px-3 py-2"
              defaultValue={toLine(props[key as string] as string)}
              onBlur={(event) =>
                updateBlockProps(index, { [key]: event.target.value })
              }
            />
          </label>
        ))}
        <label className="grid gap-1">
          Card Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.cardBackgroundColor as string) || "#ffffff"}
            onChange={(event) =>
              updateBlockProps(index, { cardBackgroundColor: event.target.value })
            }
          />
        </label>
        <WhyChooseItemsEditor
          items={(props.items as Array<Record<string, string>>) || []}
          onUpload={uploadImage}
          onChange={(next) => updateBlockProps(index, { items: next })}
        />
      </div>
    );
  }

  if (block.type === "our-core-services") {
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#fff200"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        {[
          ["heading", "Heading"],
          ["subheading", "Subheading"],
        ].map(([key, label]) => (
          <label key={key} className="grid gap-1">
            {label}
            <input
              className="rounded-xl border border-slate-200 px-3 py-2"
              defaultValue={toLine(props[key as string] as string)}
              onBlur={(event) =>
                updateBlockProps(index, { [key]: event.target.value })
              }
            />
          </label>
        ))}
        <label className="grid gap-1">
          Card Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.cardBackgroundColor as string) || "#ffffff"}
            onChange={(event) =>
              updateBlockProps(index, { cardBackgroundColor: event.target.value })
            }
          />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            Image Height (px)
            <input
              type="number"
              min={80}
              className="rounded-xl border border-slate-200 px-3 py-2"
              defaultValue={
                Number.isFinite(Number(props.imageHeight))
                  ? Number(props.imageHeight)
                  : 176
              }
              onBlur={(event) =>
                updateBlockProps(index, {
                  imageHeight: Number(event.target.value) || 176,
                })
              }
            />
          </label>
          <label className="grid gap-1">
            Card Min Height (px)
            <input
              type="number"
              min={0}
              className="rounded-xl border border-slate-200 px-3 py-2"
              defaultValue={
                Number.isFinite(Number(props.cardMinHeight))
                  ? Number(props.cardMinHeight)
                  : 0
              }
              onBlur={(event) =>
                updateBlockProps(index, {
                  cardMinHeight: Number(event.target.value) || 0,
                })
              }
            />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            CTA Background Color
            <input
              type="color"
              className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
              defaultValue={toLine(props.ctaBackgroundColor as string) || "#fff200"}
              onChange={(event) =>
                updateBlockProps(index, { ctaBackgroundColor: event.target.value })
              }
            />
          </label>
          <label className="grid gap-1">
            CTA Text Color
            <input
              type="color"
              className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
              defaultValue={toLine(props.ctaTextColor as string) || "#052a5f"}
              onChange={(event) =>
                updateBlockProps(index, { ctaTextColor: event.target.value })
              }
            />
          </label>
        </div>
        <CoreServicesEditor
          items={(props.items as Array<Record<string, string>>) || []}
          onUpload={uploadImage}
          onChange={(next) => updateBlockProps(index, { items: next })}
        />
      </div>
    );
  }

  if (block.type === "service-process") {
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#fff78a"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        {[
          ["heading", "Heading"],
          ["subheading", "Subheading"],
        ].map(([key, label]) => (
          <label key={key} className="grid gap-1">
            {label}
            <input
              className="rounded-xl border border-slate-200 px-3 py-2"
              defaultValue={toLine(props[key as string] as string)}
              onBlur={(event) =>
                updateBlockProps(index, { [key]: event.target.value })
              }
            />
          </label>
        ))}
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            Circle Color
            <input
              type="color"
              className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
              defaultValue={toLine(props.circleColor as string) || "#0b3c86"}
              onChange={(event) =>
                updateBlockProps(index, { circleColor: event.target.value })
              }
            />
          </label>
          <label className="grid gap-1">
            Line Color
            <input
              type="color"
              className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
              defaultValue={toLine(props.lineColor as string) || "#cbd5f5"}
              onChange={(event) =>
                updateBlockProps(index, { lineColor: event.target.value })
              }
            />
          </label>
          <label className="grid gap-1">
            Title Color
            <input
              type="color"
              className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
              defaultValue={toLine(props.titleColor as string) || "#052a5f"}
              onChange={(event) =>
                updateBlockProps(index, { titleColor: event.target.value })
              }
            />
          </label>
          <label className="grid gap-1">
            Subtitle Color
            <input
              type="color"
              className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
              defaultValue={toLine(props.subtitleColor as string) || "#0b3c86"}
              onChange={(event) =>
                updateBlockProps(index, { subtitleColor: event.target.value })
              }
            />
          </label>
          <label className="grid gap-1">
            Description Color
            <input
              type="color"
              className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
              defaultValue={toLine(props.descriptionColor as string) || "#475569"}
              onChange={(event) =>
                updateBlockProps(index, { descriptionColor: event.target.value })
              }
            />
          </label>
        </div>
        <ServiceProcessEditor
          items={(props.items as Array<Record<string, string>>) || []}
          onChange={(next) => updateBlockProps(index, { items: next })}
        />
      </div>
    );
  }

  if (block.type === "ready-for-service") {
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#0b3c86"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        {[
          ["heading", "Heading"],
          ["description", "Description"],
          ["primaryCtaText", "Primary CTA Text"],
          ["primaryCtaHref", "Primary CTA Link"],
          ["primaryIcon", "Primary Icon URL"],
          ["secondaryCtaText", "Secondary CTA Text"],
          ["secondaryCtaHref", "Secondary CTA Link"],
          ["secondaryIcon", "Secondary Icon URL"],
        ].map(([key, label]) => (
          <label key={key} className="grid gap-1">
            {label}
            <input
              className="rounded-xl border border-slate-200 px-3 py-2"
              defaultValue={toLine(props[key as string] as string)}
              onBlur={(event) =>
                updateBlockProps(index, { [key]: event.target.value })
              }
            />
          </label>
        ))}
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            Upload Primary Icon
            <input
              type="file"
              accept="image/*"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const url = await uploadImage(file);
                updateBlockProps(index, { primaryIcon: url });
              }}
            />
          </label>
          <label className="grid gap-1">
            Upload Secondary Icon
            <input
              type="file"
              accept="image/*"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const url = await uploadImage(file);
                updateBlockProps(index, { secondaryIcon: url });
              }}
            />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            Primary Button Background
            <input
              type="color"
              className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
              defaultValue={toLine(props.primaryCtaBackground as string) || "#ffd200"}
              onChange={(event) =>
                updateBlockProps(index, { primaryCtaBackground: event.target.value })
              }
            />
          </label>
          <label className="grid gap-1">
            Primary Button Text
            <input
              type="color"
              className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
              defaultValue={toLine(props.primaryCtaTextColor as string) || "#0b1a3a"}
              onChange={(event) =>
                updateBlockProps(index, { primaryCtaTextColor: event.target.value })
              }
            />
          </label>
          <label className="grid gap-1">
            Secondary Button Background
            <input
              type="color"
              className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
              defaultValue={toLine(props.secondaryCtaBackground as string) || "#1e4f9a"}
              onChange={(event) =>
                updateBlockProps(index, { secondaryCtaBackground: event.target.value })
              }
            />
          </label>
          <label className="grid gap-1">
            Secondary Button Text
            <input
              type="color"
              className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
              defaultValue={toLine(props.secondaryCtaTextColor as string) || "#ffffff"}
              onChange={(event) =>
                updateBlockProps(index, { secondaryCtaTextColor: event.target.value })
              }
            />
          </label>
          <label className="grid gap-1">
            Icon Color
            <input
              type="color"
              className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
              defaultValue={toLine(props.iconColor as string) || "#0b1a3a"}
              onChange={(event) =>
                updateBlockProps(index, { iconColor: event.target.value })
              }
            />
          </label>
        </div>
      </div>
    );
  }

  if (block.type === "about-us-text") {
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#0b3c86"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        {[
          ["heading", "Heading"],
          ["subheading", "Subheading"],
          ["tagline", "Tagline"],
        ].map(([key, label]) => (
          <label key={key} className="grid gap-1">
            {label}
            <input
              className="rounded-xl border border-slate-200 px-3 py-2"
              defaultValue={toLine(props[key as string] as string)}
              onBlur={(event) =>
                updateBlockProps(index, { [key]: event.target.value })
              }
            />
          </label>
        ))}
        <label className="grid gap-1">
          Description
          <textarea
            className="min-h-[90px] rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.description as string)}
            onBlur={(event) =>
              updateBlockProps(index, { description: event.target.value })
            }
          />
        </label>
      </div>
    );
  }

  if (block.type === "about-us-images") {
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#ffe800"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Heading
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.heading as string)}
            onBlur={(event) =>
              updateBlockProps(index, { heading: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Image URL
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.image as string)}
            onBlur={(event) =>
              updateBlockProps(index, { image: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          📤 Upload New Image
          <input
            type="file"
            accept="image/*"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const url = await uploadImage(file);
              updateBlockProps(index, { image: url });
            }}
          />
        </label>
        <label className="grid gap-1">
          Description
          <textarea
            className="min-h-[120px] rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.description as string)}
            onBlur={(event) =>
              updateBlockProps(index, { description: event.target.value })
            }
          />
        </label>
      </div>
    );
  }

  if (block.type === "grand-events") {
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#ffffff"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Heading
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.heading as string)}
            onBlur={(event) =>
              updateBlockProps(index, { heading: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Description
          <textarea
            className="min-h-[120px] rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.description as string)}
            onBlur={(event) =>
              updateBlockProps(index, { description: event.target.value })
            }
          />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            CTA Text
            <input
              className="rounded-xl border border-slate-200 px-3 py-2"
              defaultValue={toLine(props.ctaText as string)}
              onBlur={(event) =>
                updateBlockProps(index, { ctaText: event.target.value })
              }
            />
          </label>
          <label className="grid gap-1">
            CTA Link
            <input
              className="rounded-xl border border-slate-200 px-3 py-2"
              defaultValue={toLine(props.ctaHref as string)}
              onBlur={(event) =>
                updateBlockProps(index, { ctaHref: event.target.value })
              }
            />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            CTA Background
            <input
              type="color"
              className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
              defaultValue={toLine(props.ctaBackground as string) || "#6b6f2d"}
              onChange={(event) =>
                updateBlockProps(index, { ctaBackground: event.target.value })
              }
            />
          </label>
          <label className="grid gap-1">
            CTA Text Color
            <input
              type="color"
              className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
              defaultValue={toLine(props.ctaTextColor as string) || "#ffffff"}
              onChange={(event) =>
                updateBlockProps(index, { ctaTextColor: event.target.value })
              }
            />
          </label>
        </div>
        {[
          ["imageTop", "Top Image URL"],
          ["imageBottom", "Bottom Image URL"],
          ["imageSide", "Side Image URL"],
        ].map(([key, label]) => (
          <div key={key} className="grid gap-2 md:grid-cols-[1fr_auto]">
            <label className="grid gap-1">
              {label}
              <input
                className="rounded-xl border border-slate-200 px-3 py-2"
                defaultValue={toLine(props[key as string] as string)}
                onBlur={(event) =>
                  updateBlockProps(index, { [key]: event.target.value })
                }
              />
            </label>
            <label className="grid gap-1">
              📤 Upload New Image
              <input
                type="file"
                accept="image/*"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const url = await uploadImage(file);
                  updateBlockProps(index, { [key]: url });
                }}
              />
            </label>
          </div>
        ))}
      </div>
    );
  }

  if (block.type === "branches-detail") {
    const branches = (props.branches as BranchItem[]) || [];
    const updateBranch = (itemIndex: number, patch: Partial<BranchItem>) => {
      const next = branches.map((item, idx) =>
        idx === itemIndex ? { ...item, ...patch } : item
      );
      updateBlockProps(index, { branches: next });
    };
    const removeBranch = (itemIndex: number) => {
      const next = branches.filter((_, idx) => idx !== itemIndex);
      updateBlockProps(index, { branches: next });
    };
    const addBranch = () => {
      updateBlockProps(index, {
        branches: [
          ...branches,
          {
            id: crypto.randomUUID(),
            name: "สาขาใหม่",
            address: "",
            phone: "",
            email: "",
            hours: "",
            services: ["ติดตั้งแอร์", "ล้างแอร์"],
            mapLabel: "นำทางไปสาขานี้",
            mapHref: "https://maps.google.com",
          },
        ],
      });
    };

    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#ffe800"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Heading
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.heading as string)}
            onBlur={(event) =>
              updateBlockProps(index, { heading: event.target.value })
            }
          />
        </label>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-600">
            Branches
          </p>
          <button
            onClick={addBranch}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
          >
            + Add Branch
          </button>
        </div>
        <div className="grid gap-3">
          {branches.map((branch, branchIndex) => (
            <div
              key={branch.id}
              className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">
                  Branch #{branchIndex + 1}
                </p>
                <button
                  onClick={() => removeBranch(branchIndex)}
                  className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-600"
                >
                  Delete
                </button>
              </div>
              <label className="grid gap-1">
                Name
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={branch.name}
                  onChange={(event) =>
                    updateBranch(branchIndex, { name: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-1">
                Address
                <textarea
                  className="min-h-[80px] rounded-xl border border-slate-200 px-3 py-2"
                  value={branch.address}
                  onChange={(event) =>
                    updateBranch(branchIndex, { address: event.target.value })
                  }
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1">
                  Phone
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={branch.phone}
                    onChange={(event) =>
                      updateBranch(branchIndex, { phone: event.target.value })
                    }
                  />
                </label>
                <label className="grid gap-1">
                  Email
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={branch.email}
                    onChange={(event) =>
                      updateBranch(branchIndex, { email: event.target.value })
                    }
                  />
                </label>
              </div>
              <label className="grid gap-1">
                Hours
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={branch.hours}
                  onChange={(event) =>
                    updateBranch(branchIndex, { hours: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-1">
                Services (comma separated)
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={(branch.services || []).join(", ")}
                  onChange={(event) =>
                    updateBranch(branchIndex, {
                      services: event.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1">
                  Map Button Label
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={branch.mapLabel || ""}
                    onChange={(event) =>
                      updateBranch(branchIndex, { mapLabel: event.target.value })
                    }
                  />
                </label>
                <label className="grid gap-1">
                  Map Link
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={branch.mapHref || ""}
                    onChange={(event) =>
                      updateBranch(branchIndex, { mapHref: event.target.value })
                    }
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (block.type === "our-vision") {
    const cards = (props.cards as VisionCard[]) || [];
    const updateCard = (itemIndex: number, patch: Partial<VisionCard>) => {
      const next = cards.map((item, idx) =>
        idx === itemIndex ? { ...item, ...patch } : item
      );
      updateBlockProps(index, { cards: next });
    };
    const removeCard = (itemIndex: number) => {
      const next = cards.filter((_, idx) => idx !== itemIndex);
      updateBlockProps(index, { cards: next });
    };
    const addCard = () => {
      updateBlockProps(index, {
        cards: [
          ...cards,
          {
            id: crypto.randomUUID(),
            title: "หัวข้อใหม่",
            subtitle: "Subtitle",
            description: "",
            icon: "",
          },
        ],
      });
    };

    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#fff78a"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-600">
            Vision Cards
          </p>
          <button
            onClick={addCard}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
          >
            + Add Card
          </button>
        </div>
        <div className="grid gap-3">
          {cards.map((card, cardIndex) => (
            <div
              key={card.id}
              className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">
                  Card #{cardIndex + 1}
                </p>
                <button
                  onClick={() => removeCard(cardIndex)}
                  className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-600"
                >
                  Delete
                </button>
              </div>
              <label className="grid gap-1">
                Title
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={card.title}
                  onChange={(event) =>
                    updateCard(cardIndex, { title: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-1">
                Subtitle
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={card.subtitle || ""}
                  onChange={(event) =>
                    updateCard(cardIndex, { subtitle: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-1">
                Icon URL
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={card.icon || ""}
                  onChange={(event) =>
                    updateCard(cardIndex, { icon: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-1">
                🎨 Upload New Icon
                <input
                  type="file"
                  accept="image/*"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file);
                    updateCard(cardIndex, { icon: url });
                  }}
                />
              </label>
              <label className="grid gap-1">
                Description
                <textarea
                  className="min-h-[120px] rounded-xl border border-slate-200 px-3 py-2"
                  value={card.description}
                  onChange={(event) =>
                    updateCard(cardIndex, { description: event.target.value })
                  }
                />
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (block.type === "our-core-values") {
    const items = (props.items as CoreValueItem[]) || [];
    const updateItemValue = (itemIndex: number, patch: Partial<CoreValueItem>) => {
      const next = items.map((item, idx) =>
        idx === itemIndex ? { ...item, ...patch } : item
      );
      updateBlockProps(index, { items: next });
    };
    const removeItem = (itemIndex: number) => {
      const next = items.filter((_, idx) => idx !== itemIndex);
      updateBlockProps(index, { items: next });
    };
    const addItem = () => {
      updateBlockProps(index, {
        items: [
          ...items,
          {
            id: crypto.randomUUID(),
            title: "หัวข้อใหม่",
            subtitle: "",
            description: "",
            icon: "",
          },
        ],
      });
    };

    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#ffe800"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        {[
          ["heading", "Heading"],
          ["subheading", "Subheading"],
        ].map(([key, label]) => (
          <label key={key} className="grid gap-1">
            {label}
            <input
              className="rounded-xl border border-slate-200 px-3 py-2"
              defaultValue={toLine(props[key as string] as string)}
              onBlur={(event) =>
                updateBlockProps(index, { [key]: event.target.value })
              }
            />
          </label>
        ))}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-600">Values</p>
          <button
            onClick={addItem}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
          >
            + Add Value
          </button>
        </div>
        <div className="grid gap-3">
          {items.map((item, itemIndex) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">
                  Value #{itemIndex + 1}
                </p>
                <button
                  onClick={() => removeItem(itemIndex)}
                  className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-600"
                >
                  Delete
                </button>
              </div>
              <label className="grid gap-1">
                Title
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={item.title}
                  onChange={(event) =>
                    updateItemValue(itemIndex, { title: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-1">
                Subtitle
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={item.subtitle || ""}
                  onChange={(event) =>
                    updateItemValue(itemIndex, { subtitle: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-1">
                Icon URL
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={item.icon || ""}
                  onChange={(event) =>
                    updateItemValue(itemIndex, { icon: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-1">
                🎨 Upload New Icon
                <input
                  type="file"
                  accept="image/*"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file);
                    updateItemValue(itemIndex, { icon: url });
                  }}
                />
              </label>
              <label className="grid gap-1">
                Description
                <textarea
                  className="min-h-[120px] rounded-xl border border-slate-200 px-3 py-2"
                  value={item.description}
                  onChange={(event) =>
                    updateItemValue(itemIndex, { description: event.target.value })
                  }
                />
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (block.type === "why-choose-us-v2") {
    const items = (props.items as WhyChooseV2Item[]) || [];
    const updateItemValue = (itemIndex: number, text: string) => {
      const next = items.map((item, idx) =>
        idx === itemIndex ? { ...item, text } : item
      );
      updateBlockProps(index, { items: next });
    };
    const removeItem = (itemIndex: number) => {
      const next = items.filter((_, idx) => idx !== itemIndex);
      updateBlockProps(index, { items: next });
    };
    const addItem = () => {
      updateBlockProps(index, {
        items: [...items, { id: crypto.randomUUID(), text: "ข้อความใหม่" }],
      });
    };

    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#fff78a"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        {[
          ["heading", "Heading"],
          ["subheading", "Subheading"],
        ].map(([key, label]) => (
          <label key={key} className="grid gap-1">
            {label}
            <input
              className="rounded-xl border border-slate-200 px-3 py-2"
              defaultValue={toLine(props[key as string] as string)}
              onBlur={(event) =>
                updateBlockProps(index, { [key]: event.target.value })
              }
            />
          </label>
        ))}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-600">Items</p>
          <button
            onClick={addItem}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
          >
            + Add Item
          </button>
        </div>
        <div className="grid gap-3">
          {items.map((item, itemIndex) => (
            <div
              key={item.id}
              className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">
                  Item #{itemIndex + 1}
                </p>
                <button
                  onClick={() => removeItem(itemIndex)}
                  className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-600"
                >
                  Delete
                </button>
              </div>
              <label className="grid gap-1">
                Text
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={item.text}
                  onChange={(event) =>
                    updateItemValue(itemIndex, event.target.value)
                  }
                />
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (block.type === "work-with-us") {
    const blockProps = props as WorkWithUsProps;
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(blockProps.backgroundColor as string) || "#0b3c86"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        {[
          ["heading", "Heading"],
          ["subheading", "Subheading"],
          ["icon", "Icon URL"],
        ].map(([key, label]) => (
          <label key={key} className="grid gap-1">
            {label}
            <input
              className="rounded-xl border border-slate-200 px-3 py-2"
              defaultValue={toLine(props[key as string] as string)}
              onBlur={(event) =>
                updateBlockProps(index, { [key]: event.target.value })
              }
            />
          </label>
        ))}
        <label className="grid gap-1">
          🎨 Upload New Icon
          <input
            type="file"
            accept="image/*"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const url = await uploadImage(file);
              updateBlockProps(index, { icon: url });
            }}
          />
        </label>
      </div>
    );
  }

  if (block.type === "welfare-and-benefits") {
    const items = (props.items as BenefitItem[]) || [];
    const updateItemValue = (itemIndex: number, patch: Partial<BenefitItem>) => {
      const next = items.map((item, idx) =>
        idx === itemIndex ? { ...item, ...patch } : item
      );
      updateBlockProps(index, { items: next });
    };
    const removeItem = (itemIndex: number) => {
      const next = items.filter((_, idx) => idx !== itemIndex);
      updateBlockProps(index, { items: next });
    };
    const addItem = () => {
      updateBlockProps(index, {
        items: [
          ...items,
          {
            id: crypto.randomUUID(),
            title: "สวัสดิการใหม่",
            description: "",
            icon: "",
          },
        ],
      });
    };

    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#fff78a"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Heading
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.heading as string)}
            onBlur={(event) =>
              updateBlockProps(index, { heading: event.target.value })
            }
          />
        </label>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-600">Benefits</p>
          <button
            onClick={addItem}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
          >
            + Add Benefit
          </button>
        </div>
        <div className="grid gap-3">
          {items.map((item, itemIndex) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">
                  Benefit #{itemIndex + 1}
                </p>
                <button
                  onClick={() => removeItem(itemIndex)}
                  className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-600"
                >
                  Delete
                </button>
              </div>
              <label className="grid gap-1">
                Title
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={item.title}
                  onChange={(event) =>
                    updateItemValue(itemIndex, { title: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-1">
                Icon URL
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={item.icon || ""}
                  onChange={(event) =>
                    updateItemValue(itemIndex, { icon: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-1">
                🎨 Upload New Icon
                <input
                  type="file"
                  accept="image/*"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file);
                    updateItemValue(itemIndex, { icon: url });
                  }}
                />
              </label>
              <label className="grid gap-1">
                Description
                <textarea
                  className="min-h-[90px] rounded-xl border border-slate-200 px-3 py-2"
                  value={item.description}
                  onChange={(event) =>
                    updateItemValue(itemIndex, { description: event.target.value })
                  }
                />
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (block.type === "job-vacancies") {
    const jobs = (props.jobs as JobVacancy[]) || [];
    const updateJob = (jobIndex: number, patch: Partial<JobVacancy>) => {
      const next = jobs.map((job, idx) =>
        idx === jobIndex ? { ...job, ...patch } : job
      );
      updateBlockProps(index, { jobs: next });
    };
    const removeJob = (jobIndex: number) => {
      const next = jobs.filter((_, idx) => idx !== jobIndex);
      updateBlockProps(index, { jobs: next });
    };
    const addJob = () => {
      updateBlockProps(index, {
        jobs: [
          ...jobs,
          {
            id: crypto.randomUUID(),
            title: "Job title",
            location: "",
            type: "",
            salary: "",
            applyLabel: "Apply for a job",
            applyHref: "/contact",
            features: [],
          },
        ],
      });
    };

    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#ffe800"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Heading
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.heading as string)}
            onBlur={(event) =>
              updateBlockProps(index, { heading: event.target.value })
            }
          />
        </label>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-600">Jobs</p>
          <button
            onClick={addJob}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
          >
            + Add Job
          </button>
        </div>
        <div className="grid gap-3">
          {jobs.map((job, jobIndex) => (
            <div
              key={job.id}
              className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">
                  Job #{jobIndex + 1}
                </p>
                <button
                  onClick={() => removeJob(jobIndex)}
                  className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-600"
                >
                  Delete
                </button>
              </div>
              <label className="grid gap-1">
                Title
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={job.title}
                  onChange={(event) =>
                    updateJob(jobIndex, { title: event.target.value })
                  }
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1">
                  Location
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={job.location}
                    onChange={(event) =>
                      updateJob(jobIndex, { location: event.target.value })
                    }
                  />
                </label>
                <label className="grid gap-1">
                  Work Type
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={job.type}
                    onChange={(event) =>
                      updateJob(jobIndex, { type: event.target.value })
                    }
                  />
                </label>
              </div>
              <label className="grid gap-1">
                Salary
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={job.salary}
                  onChange={(event) =>
                    updateJob(jobIndex, { salary: event.target.value })
                  }
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1">
                  Apply Button Label
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={job.applyLabel || ""}
                    onChange={(event) =>
                      updateJob(jobIndex, { applyLabel: event.target.value })
                    }
                  />
                </label>
                <label className="grid gap-1">
                  Apply Link
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2"
                    value={job.applyHref || ""}
                    onChange={(event) =>
                      updateJob(jobIndex, { applyHref: event.target.value })
                    }
                  />
                </label>
              </div>
              <label className="grid gap-1">
                Features (one per line)
                <textarea
                  className="min-h-[120px] rounded-xl border border-slate-200 px-3 py-2"
                  defaultValue={(job.features || []).join("\n")}
                  onBlur={(event) =>
                    updateJob(jobIndex, {
                      features: event.target.value
                        .split("\n")
                        .map((line) => line.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (block.type === "request-quotation-forms") {
    const blockProps = props as RequestQuotationProps;
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(blockProps.backgroundColor as string) || "#ffe800"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        {[
          ["heading", "Heading"],
          ["subheading", "Subheading"],
          ["nameLabel", "Name Label"],
          ["companyLabel", "Company Label"],
          ["emailLabel", "Email Label"],
          ["phoneLabel", "Phone Label"],
          ["serviceLabel", "Service Label"],
          ["detailsLabel", "Details Label"],
          ["submitLabel", "Submit Button"],
          ["submitNote", "Submit Note"],
          ["successTitle", "Success Title"],
          ["successMessage", "Success Message"],
        ].map(([key, label]) => (
          <label key={key} className="grid gap-1">
            {label}
            <input
              className="rounded-xl border border-slate-200 px-3 py-2"
              defaultValue={toLine(props[key as string] as string)}
              onBlur={(event) =>
                updateBlockProps(index, { [key]: event.target.value })
              }
            />
          </label>
        ))}
        <label className="grid gap-1">
          Services (one per line)
          <textarea
            className="min-h-[120px] rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={(blockProps.services || []).join("\n")}
            onBlur={(event) =>
              updateBlockProps(index, {
                services: event.target.value
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
      </div>
    );
  }

  if (block.type === "contact-channels") {
    const channels = (props.channels as ContactChannel[]) || [];
    const ctaButtons = (props.ctaButtons as ContactChannelCta[]) || [];
    const updateChannel = (
      itemIndex: number,
      patch: Partial<ContactChannel>
    ) => {
      const next = channels.map((item, idx) =>
        idx === itemIndex ? { ...item, ...patch } : item
      );
      updateBlockProps(index, { channels: next });
    };
    const removeChannel = (itemIndex: number) => {
      const next = channels.filter((_, idx) => idx !== itemIndex);
      updateBlockProps(index, { channels: next });
    };
    const addChannel = () => {
      updateBlockProps(index, {
        channels: [
          ...channels,
          {
            id: crypto.randomUUID(),
            title: "หัวข้อใหม่",
            subtitle: "",
            primary: "",
            secondary: "",
            note: "",
            icon: "",
          },
        ],
      });
    };
    const updateCta = (itemIndex: number, patch: Partial<ContactChannelCta>) => {
      const next = ctaButtons.map((item, idx) =>
        idx === itemIndex ? { ...item, ...patch } : item
      );
      updateBlockProps(index, { ctaButtons: next });
    };
    const removeCta = (itemIndex: number) => {
      const next = ctaButtons.filter((_, idx) => idx !== itemIndex);
      updateBlockProps(index, { ctaButtons: next });
    };
    const addCta = () => {
      updateBlockProps(index, {
        ctaButtons: [
          ...ctaButtons,
          {
            id: crypto.randomUUID(),
            label: "โทรสาย",
            href: "tel:",
            icon: "",
          },
        ],
      });
    };

    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#ffe800"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        {[
          ["heading", "Heading"],
          ["subheading", "Subheading"],
          ["ctaTitle", "CTA Title"],
          ["ctaSubtitle", "CTA Subtitle"],
        ].map(([key, label]) => (
          <label key={key} className="grid gap-1">
            {label}
            <input
              className="rounded-xl border border-slate-200 px-3 py-2"
              defaultValue={toLine(props[key as string] as string)}
              onBlur={(event) =>
                updateBlockProps(index, { [key]: event.target.value })
              }
            />
          </label>
        ))}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-600">Channels</p>
          <button
            onClick={addChannel}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
          >
            + Add Channel
          </button>
        </div>
        <div className="grid gap-3">
          {channels.map((channel, channelIndex) => (
            <div
              key={channel.id}
              className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">
                  Channel #{channelIndex + 1}
                </p>
                <button
                  onClick={() => removeChannel(channelIndex)}
                  className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-600"
                >
                  Delete
                </button>
              </div>
              <label className="grid gap-1">
                Title
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={channel.title}
                  onChange={(event) =>
                    updateChannel(channelIndex, { title: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-1">
                Subtitle
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={channel.subtitle || ""}
                  onChange={(event) =>
                    updateChannel(channelIndex, {
                      subtitle: event.target.value,
                    })
                  }
                />
              </label>
              <label className="grid gap-1">
                Icon URL
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={channel.icon || ""}
                  onChange={(event) =>
                    updateChannel(channelIndex, { icon: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-1">
                🎨 Upload New Icon
                <input
                  type="file"
                  accept="image/*"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file);
                    updateChannel(channelIndex, { icon: url });
                  }}
                />
              </label>
              <label className="grid gap-1">
                Primary Text
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={channel.primary}
                  onChange={(event) =>
                    updateChannel(channelIndex, { primary: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-1">
                Secondary Text
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={channel.secondary || ""}
                  onChange={(event) =>
                    updateChannel(channelIndex, {
                      secondary: event.target.value,
                    })
                  }
                />
              </label>
              <label className="grid gap-1">
                Note
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={channel.note || ""}
                  onChange={(event) =>
                    updateChannel(channelIndex, { note: event.target.value })
                  }
                />
              </label>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-600">CTA Buttons</p>
          <button
            onClick={addCta}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
          >
            + Add CTA
          </button>
        </div>
        <div className="grid gap-3">
          {ctaButtons.map((cta, ctaIndex) => (
            <div
              key={cta.id}
              className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">
                  CTA #{ctaIndex + 1}
                </p>
                <button
                  onClick={() => removeCta(ctaIndex)}
                  className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-600"
                >
                  Delete
                </button>
              </div>
              <label className="grid gap-1">
                Label
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={cta.label}
                  onChange={(event) =>
                    updateCta(ctaIndex, { label: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-1">
                Link
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={cta.href}
                  onChange={(event) =>
                    updateCta(ctaIndex, { href: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-1">
                Icon URL
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  value={cta.icon || ""}
                  onChange={(event) =>
                    updateCta(ctaIndex, { icon: event.target.value })
                  }
                />
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (block.type === "contact-us-text") {
    const blockProps = props as ContactUsTextProps;
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            Background Color
            <input
              type="color"
              className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
              defaultValue={toLine(blockProps.backgroundColor as string) || "#0b3c86"}
              onChange={(event) =>
                updateBlockProps(index, { backgroundColor: event.target.value })
              }
            />
          </label>
          <label className="grid gap-1">
            Gradient Color
            <input
              type="color"
              className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
              defaultValue={toLine(blockProps.gradientColor as string) || "#f7c326"}
              onChange={(event) =>
                updateBlockProps(index, { gradientColor: event.target.value })
              }
            />
          </label>
        </div>
        {[
          ["heading", "Heading"],
          ["subheading", "Subheading"],
        ].map(([key, label]) => (
          <label key={key} className="grid gap-1">
            {label}
            <input
              className="rounded-xl border border-slate-200 px-3 py-2"
              defaultValue={toLine(props[key as string] as string)}
              onBlur={(event) =>
                updateBlockProps(index, { [key]: event.target.value })
              }
            />
          </label>
        ))}
        <label className="grid gap-1">
          Description
          <textarea
            className="min-h-[90px] rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.description as string)}
            onBlur={(event) =>
              updateBlockProps(index, { description: event.target.value })
            }
          />
        </label>
      </div>
    );
  }

  if (block.type === "our-portfolio") {
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#fff78a"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        {[
          ["heading", "Heading"],
          ["subheading", "Subheading"],
        ].map(([key, label]) => (
          <label key={key} className="grid gap-1">
            {label}
            <input
              className="rounded-xl border border-slate-200 px-3 py-2"
              defaultValue={toLine(props[key as string] as string)}
              onBlur={(event) =>
                updateBlockProps(index, { [key]: event.target.value })
              }
            />
          </label>
        ))}
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            Overlay Color
            <input
              type="color"
              className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
              defaultValue={toLine(props.overlayColor as string) || "#0b3c86"}
              onChange={(event) =>
                updateBlockProps(index, { overlayColor: event.target.value })
              }
            />
          </label>
          <label className="grid gap-1">
            Overlay Opacity (0-1)
            <input
              type="number"
              step="0.05"
              min={0}
              max={1}
              className="rounded-xl border border-slate-200 px-3 py-2"
              defaultValue={
                Number.isFinite(Number(props.overlayOpacity))
                  ? Number(props.overlayOpacity)
                  : 0.65
              }
              onBlur={(event) =>
                updateBlockProps(index, {
                  overlayOpacity: Number(event.target.value) || 0.65,
                })
              }
            />
          </label>
          <label className="grid gap-1">
            Tile Height (px)
            <input
              type="number"
              min={120}
              className="rounded-xl border border-slate-200 px-3 py-2"
              defaultValue={
                Number.isFinite(Number(props.tileHeight))
                  ? Number(props.tileHeight)
                  : 176
              }
              onBlur={(event) =>
                updateBlockProps(index, {
                  tileHeight: Number(event.target.value) || 176,
                })
              }
            />
          </label>
        </div>
        <PortfolioEditor
          items={(props.items as Array<Record<string, string>>) || []}
          onUpload={uploadImage}
          onChange={(next) => updateBlockProps(index, { items: next })}
        />
      </div>
    );
  }

  if (
    block.type === "our-services-v2" ||
    block.type === "products-section-images"
  ) {
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#ffffff"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Eyebrow
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.eyebrow as string)}
            onBlur={(event) =>
              updateBlockProps(index, { eyebrow: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Section Title
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.title as string)}
            onBlur={(event) =>
              updateBlockProps(index, { title: event.target.value })
            }
          />
        </label>
        <OurServicesV2Editor
          items={(props.items as Array<Record<string, string>>) || []}
          onUpload={uploadImage}
          onChange={(next) => updateBlockProps(index, { items: next })}
        />
      </div>
    );
  }

  if (block.type === "our-work") {
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#ffffff"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Heading
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.heading as string)}
            onBlur={(event) =>
              updateBlockProps(index, { heading: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Subheading
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.subheading as string)}
            onBlur={(event) =>
              updateBlockProps(index, { subheading: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Description
          <textarea
            className="min-h-[80px] rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.description as string)}
            onBlur={(event) =>
              updateBlockProps(index, { description: event.target.value })
            }
          />
        </label>
        <OurWorkEditor
          items={(props.items as Array<Record<string, string>>) || []}
          onUpload={uploadImage}
          onChange={(next) => updateBlockProps(index, { items: next })}
        />
      </div>
    );
  }

  if (block.type === "our-work-gallery") {
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#f8fafc"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Heading
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.heading as string)}
            onBlur={(event) =>
              updateBlockProps(index, { heading: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Subheading
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.subheading as string)}
            onBlur={(event) =>
              updateBlockProps(index, { subheading: event.target.value })
            }
          />
        </label>
        <GalleryEditor
          images={(props.images as Array<Record<string, string>>) || []}
          onUpload={uploadImage}
          onChange={(next) => updateBlockProps(index, { images: next })}
        />
      </div>
    );
  }

  if (block.type === "wellness-facilities") {
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#ffffff"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        <OurServicesV2Editor
          items={(props.items as Array<Record<string, string>>) || []}
          onUpload={uploadImage}
          onChange={(next) => updateBlockProps(index, { items: next })}
        />
      </div>
    );
  }

  if (block.type === "images-slider") {
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#ffffff"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Heading
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.heading as string)}
            onBlur={(event) =>
              updateBlockProps(index, { heading: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Subheading
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.subheading as string)}
            onBlur={(event) =>
              updateBlockProps(index, { subheading: event.target.value })
            }
          />
        </label>
        <GalleryEditor
          images={(props.images as Array<Record<string, string>>) || []}
          onUpload={uploadImage}
          onChange={(next) => updateBlockProps(index, { images: next })}
        />
      </div>
    );
  }

  if (block.type === "frequently-asked-questions") {
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#ffffff"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Section Title
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.title as string)}
            onBlur={(event) =>
              updateBlockProps(index, { title: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Subtitle
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.subtitle as string)}
            onBlur={(event) =>
              updateBlockProps(index, { subtitle: event.target.value })
            }
          />
        </label>
        <FrequentlyAskedQuestionsEditor
          items={(props.items as Array<Record<string, string>>) || []}
          onChange={(next) => updateBlockProps(index, { items: next })}
        />
      </div>
    );
  }

  if (
    ["services", "features", "faq"].includes(block.type)
  ) {
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#ffffff"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Section Title
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.title as string)}
            onBlur={(event) =>
              updateBlockProps(index, { title: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Items (one per line)
          <textarea
            key={`${block.uid}-items`}
            className="min-h-[120px] rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={formatItems(block.type, props)}
            onBlur={(event) =>
              updateBlockProps(index, {
                [block.type === "gallery" ? "images" : "items"]: parseItems(
                  block.type,
                  event.target.value
                ),
              })
            }
          />
        </label>
        <p className="text-[11px] text-slate-400">
          ใช้รูปแบบ: Title | Description | Price | CTA Text | CTA Link (Services), Image | Title | Description | CTA Text | CTA Link (Our Services V2) หรือ Question | Answer (FAQ)
        </p>
      </div>
    );
  }

  if (block.type === "gallery") {
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#ffffff"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Section Title
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.title as string)}
            onBlur={(event) =>
              updateBlockProps(index, { title: event.target.value })
            }
          />
        </label>
        <GalleryEditor
          images={(props.images as Array<Record<string, string>>) || []}
          onUpload={uploadImage}
          onChange={(next) => updateBlockProps(index, { images: next })}
        />
      </div>
    );
  }

  if (block.type === "contact") {
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#ffffff"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        {[
          ["title", "Title"],
          ["phone", "Phone"],
          ["note", "Note"],
          ["ctaText", "CTA Text"],
          ["ctaHref", "CTA Link"],
        ].map(([key, label]) => (
          <label key={key} className="grid gap-1">
            {label}
            <input
              className="rounded-xl border border-slate-200 px-3 py-2"
              defaultValue={toLine(props[key as string] as string)}
              onBlur={(event) =>
                updateBlockProps(index, { [key]: event.target.value })
              }
            />
          </label>
        ))}
      </div>
    );
  }

  if (block.type === "google-map") {
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.backgroundColor as string) || "#ffffff"}
            onChange={(event) =>
              updateBlockProps(index, { backgroundColor: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Heading
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.heading as string)}
            onBlur={(event) =>
              updateBlockProps(index, { heading: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Map URL or Embed iframe
          <textarea
            className="rounded-xl border border-slate-200 px-3 py-2"
            rows={4}
            defaultValue={toLine(props.mapUrl as string)}
            onBlur={(event) =>
              updateBlockProps(index, {
                mapUrl: extractMapEmbedSrc(event.target.value),
              })
            }
          />
        </label>
        <p className="text-[11px] text-slate-400">
          Tip: Google Maps → Share → Embed a map → copy the iframe or embed URL.
        </p>
        <label className="grid gap-1">
          Map Height (px)
          <input
            type="number"
            min="200"
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={props.height as number || 420}
            onBlur={(event) =>
              updateBlockProps(index, {
                height: Number(event.target.value) || 420,
              })
            }
          />
        </label>
      </div>
    );
  }

  if (block.type === "top-products-sales") {
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Heading
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.heading as string)}
            onBlur={(event) =>
              updateBlockProps(index, { heading: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Subheading (optional)
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.subheading as string)}
            onBlur={(event) =>
              updateBlockProps(index, { subheading: event.target.value })
            }
          />
        </label>

        {/* Product Selector */}
        <ProductSelector
          selectedProducts={(props.selectedProducts as SelectedProduct[]) || []}
          onChange={(products) => updateBlockProps(index, { selectedProducts: products })}
        />
      </div>
    );
  }

  if (block.type === "featured-categories") {
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Heading
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.heading as string)}
            onBlur={(event) =>
              updateBlockProps(index, { heading: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Explore Text
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.exploreText as string) || "EXPLORE ALL"}
            onBlur={(event) =>
              updateBlockProps(index, { exploreText: event.target.value })
            }
          />
        </label>

        {/* Category Selector */}
        <CategorySelector
          selectedCategories={(props.selectedCategories as SelectedCategory[]) || []}
          onChange={(categories) => updateBlockProps(index, { selectedCategories: categories })}
        />
      </div>
    );
  }

  if (block.type === "hero-images-with-button") {
    return (
      <div className="mt-3 grid gap-3 text-xs text-slate-600">
        <label className="grid gap-1">
          Background Image
          <ImageUploader
            value={toLine(props.backgroundImage as string)}
            onChange={(url) => updateBlockProps(index, { backgroundImage: url })}
            onUpload={uploadImage}
          />
        </label>
        <label className="grid gap-1">
          Overlay Opacity (0-1)
          <input
            type="number"
            step="0.1"
            min="0"
            max="1"
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={props.overlayOpacity as number || 0.5}
            onBlur={(event) =>
              updateBlockProps(index, { overlayOpacity: parseFloat(event.target.value) || 0.5 })
            }
          />
        </label>
        <label className="grid gap-1">
          Title
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.title as string)}
            onBlur={(event) =>
              updateBlockProps(index, { title: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Description
          <textarea
            className="rounded-xl border border-slate-200 px-3 py-2"
            rows={3}
            defaultValue={toLine(props.description as string)}
            onBlur={(event) =>
              updateBlockProps(index, { description: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Button Text
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.buttonText as string) || "LEARN MORE"}
            onBlur={(event) =>
              updateBlockProps(index, { buttonText: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Button Link
          <input
            className="rounded-xl border border-slate-200 px-3 py-2"
            defaultValue={toLine(props.buttonHref as string) || "#"}
            onBlur={(event) =>
              updateBlockProps(index, { buttonHref: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Button Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.buttonColor as string) || "#f59e0b"}
            onChange={(event) =>
              updateBlockProps(index, { buttonColor: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1">
          Button Text Color
          <input
            type="color"
            className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
            defaultValue={toLine(props.buttonTextColor as string) || "#000000"}
            onChange={(event) =>
              updateBlockProps(index, { buttonTextColor: event.target.value })
            }
          />
        </label>
      </div>
    );
  }

  return null;
}
