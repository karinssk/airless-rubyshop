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
import { useEffect, useState } from "react";
import { backendBaseUrl, resolveUploadUrl } from "@/lib/urls";
import Swal from "sweetalert2";
import { LanguageTabs, type Language } from "../pages/builder/LanguageTabs";
import type { MenuItem, ContactBarItem, MenuData, MultiLangString } from "./types";
import { getLangString } from "./types";

const API_URL = backendBaseUrl;

function SortableItem({
  item,
  activeLanguage,
  onChange,
  onRemove,
  onAddChild,
  onChangeChild,
  onRemoveChild,
  onAddSubChild,
  onChangeSubChild,
  onRemoveSubChild,
}: {
  item: MenuItem;
  activeLanguage: Language;
  onChange: (patch: Partial<MenuItem>) => void;
  onRemove: () => void;
  onAddChild: () => void;
  onChangeChild: (index: number, patch: Partial<MenuItem>) => void;
  onRemoveChild: (index: number) => void;
  onAddSubChild: (childIndex: number) => void;
  onChangeSubChild: (childIndex: number, subChildIndex: number, patch: Partial<MenuItem>) => void;
  onRemoveSubChild: (childIndex: number, subChildIndex: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Helper to extract language-specific string
  const getLabel = (label: MultiLangString) => getLangString(label, activeLanguage);

  // Helper to update multi-language string
  const updateLabel = (currentLabel: MultiLangString, newValue: string): MultiLangString => {
    if (typeof currentLabel === "string") {
      return {
        th: activeLanguage === "th" ? newValue : currentLabel,
        en: activeLanguage === "en" ? newValue : "",
      };
    }
    return { ...currentLabel, [activeLanguage]: newValue };
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-2xl border border-slate-300 bg-white p-5 shadow-md"
    >
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="cursor-grab rounded-lg bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-xs font-semibold shadow-md transition-colors"
          {...attributes}
          {...listeners}
        >
          ⠿ Drag
        </button>
        <input
          className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
          value={getLabel(item.label)}
          onChange={(event) => onChange({ label: updateLabel(item.label, event.target.value) })}
          placeholder="Label"
        />
        <input
          className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
          value={item.href}
          onChange={(event) => onChange({ href: event.target.value })}
          placeholder="/slug"
        />
        <button
          onClick={onRemove}
          className="rounded-full bg-rose-200 px-3 py-1 text-xs font-semibold text-rose-700"
        >
          Delete
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Dropdown Items
          </p>
          <button
            onClick={onAddChild}
            className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold"
          >
            + Add
          </button>
        </div>
        <div className="mt-3 grid gap-3">
          {(item.children || []).map((child, index) => (
            <div key={child.id} className="rounded-xl bg-white p-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                  value={getLabel(child.label)}
                  onChange={(event) =>
                    onChangeChild(index, { label: updateLabel(child.label, event.target.value) })
                  }
                  placeholder="Label"
                />
                <input
                  className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                  value={child.href}
                  onChange={(event) =>
                    onChangeChild(index, { href: event.target.value })
                  }
                  placeholder="/slug"
                />
                <button
                  onClick={() => onRemoveChild(index)}
                  className="rounded-full bg-rose-200 px-3 py-1 text-xs font-semibold text-rose-700"
                >
                  Delete
                </button>
              </div>

              {/* Sub-menu section */}
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Sub-menu Items (›)
                  </p>
                  <button
                    onClick={() => onAddSubChild(index)}
                    className="rounded-full border border-slate-300 bg-white px-2 py-1 text-[10px] font-semibold"
                  >
                    + Add Sub
                  </button>
                </div>
                <div className="grid gap-2">
                  {(child.children || []).map((subChild, subIndex) => (
                    <div
                      key={subChild.id}
                      className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-2 text-xs"
                    >
                      <input
                        className="flex-1 rounded border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs"
                        value={getLabel(subChild.label)}
                        onChange={(event) =>
                          onChangeSubChild(index, subIndex, { label: updateLabel(subChild.label, event.target.value) })
                        }
                        placeholder="Sub-menu label"
                      />
                      <input
                        className="flex-1 rounded border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs"
                        value={subChild.href}
                        onChange={(event) =>
                          onChangeSubChild(index, subIndex, { href: event.target.value })
                        }
                        placeholder="/sub-slug"
                      />
                      <button
                        onClick={() => onRemoveSubChild(index, subIndex)}
                        className="rounded bg-rose-100 px-2 py-1 text-[10px] font-semibold text-rose-700"
                      >
                        Del
                      </button>
                    </div>
                  ))}
                  {(!child.children || child.children.length === 0) && (
                    <p className="text-[10px] text-slate-400">
                      No sub-menu items
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(item.children || []).length === 0 && (
            <p className="text-xs text-slate-400">
              No dropdown items for this menu.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function EditableText({
  value,
  onCommit,
  className,
}: {
  value: string;
  onCommit: (next: string) => void;
  className?: string;
}) {
  return (
    <span
      className={`inline-block rounded-md px-1 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 ${className || ""}`}
      contentEditable
      suppressContentEditableWarning
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          (event.currentTarget as HTMLElement).blur();
        }
      }}
      onBlur={(event) => onCommit(event.currentTarget.textContent?.trim() || "")}
    >
      {value}
    </span>
  );
}

function NavbarPreview({
  menu,
  activeLanguage,
  onItemLabelChange,
  onItemHrefChange,
  onChildLabelChange,
  onChildHrefChange,
  onCtaLabelChange,
  onCtaHrefChange,
}: {
  menu: MenuData;
  activeLanguage: Language;
  onItemLabelChange: (index: number, value: string) => void;
  onItemHrefChange: (index: number, value: string) => void;
  onChildLabelChange: (index: number, childIndex: number, value: string) => void;
  onChildHrefChange: (index: number, childIndex: number, value: string) => void;
  onCtaLabelChange: (value: string) => void;
  onCtaHrefChange: (value: string) => void;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  // Helper to get localized string
  const getLabel = (label: MultiLangString) => getLangString(label, activeLanguage);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Live Preview (Hover over menu items to see dropdowns, hover items with "›" for sub-menus)
      </p>
      <div className="mt-4 min-h-[400px] items-start overflow-visible rounded-2xl overflow-hidden relative">
        {/* Contact Bar Preview */}
        {menu.contactBar?.enabled && menu.contactBar.items.length > 0 && (
          <div
            className="py-2 px-6"
            style={{
              backgroundColor: menu.contactBar.backgroundColor || "#f8f9fa",
              color: menu.contactBar.textColor || "#000000",
            }}
          >
            <div className="mx-auto flex max-w-6xl items-center justify-end gap-6 text-xs">
              {menu.contactBar.items.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  {item.link ? (
                    <a href={item.link} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                      <span>{item.icon}</span>
                      <span>{getLabel(item.text)}</span>
                    </a>
                  ) : (
                    <>
                      <span>{item.icon}</span>
                      <span>{getLabel(item.text)}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navbar */}
        <div className="bg-[#0b3c86]">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-white">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white md:hidden"
                onClick={() => setMobileOpen((prev) => !prev)}
              >
                ☰
              </button>
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/15">
                {menu.logoUrl ? (
                  <img
                    src={resolveUploadUrl(menu.logoUrl)}
                    alt="Logo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] text-white/60">Logo</span>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold">RUBYSHOP</p>
                <p className="text-[11px] text-white/70">Hotel Reservation Services</p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <div className="relative">
                <button
                  type="button"
                  className="flex h-9 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 text-[10px] font-semibold uppercase"
                  onClick={() => setLanguageOpen((prev) => !prev)}
                >
                  {activeLanguage}
                  <span className="text-[9px]">▾</span>
                </button>
                {languageOpen && (
                  <div className="absolute right-0 top-full z-10 mt-2 w-20 rounded-xl border border-slate-200 bg-white p-1 text-[10px] text-slate-700 shadow-xl">
                    {["th", "en"].map((lng) => (
                      <button
                        key={lng}
                        className={`w-full rounded-lg px-2 py-1 text-left uppercase ${
                          lng === activeLanguage ? "bg-slate-900 text-white" : "hover:bg-slate-100"
                        }`}
                      >
                        {lng}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="inline-flex items-center rounded-full bg-white text-[#0b3c86] px-4 py-1.5 text-[10px] font-semibold">
                Book
              </span>
            </div>

            <div className="hidden items-center gap-6 text-sm md:flex">
              {menu.items.map((item, index) => (
                <div
                  key={item.id}
                  className="group relative"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div className="flex flex-col items-center gap-1 cursor-pointer transition-colors group-hover:text-[#ffd200]">
                    <span className="flex items-center gap-1">
                      <EditableText
                        value={getLabel(item.label)}
                        onCommit={(value) => onItemLabelChange(index, value)}
                      />
                      {item.children && item.children.length > 0 && (
                        <span className="text-[10px] transition-transform group-hover:rotate-180">▼</span>
                      )}
                    </span>
                    <span className="text-[10px] text-white/50 group-hover:text-[#ffd200]/70">
                      <EditableText
                        value={item.href}
                        onCommit={(value) => onItemHrefChange(index, value)}
                        className="text-white/50 group-hover:text-[#ffd200]/70"
                      />
                    </span>
                  </div>
                  {item.children && item.children.length > 0 && (
                    <div className={`absolute left-0 top-full mt-2 w-56 rounded-xl bg-white p-2 text-slate-700 shadow-2xl border border-slate-200 transition-all duration-200 ${hoveredIndex === index ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                      <div className="grid gap-1 text-sm">
                        {item.children.map((child, childIndex) => (
                          <div
                            key={child.id}
                            className="relative group/child"
                          >
                            <div className="rounded-lg px-3 py-2 hover:bg-slate-100 transition-colors cursor-pointer border-l-2 border-transparent hover:border-yellow-400 flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium flex items-center gap-2">
                                  <EditableText
                                    value={getLabel(child.label)}
                                    onCommit={(value) =>
                                      onChildLabelChange(index, childIndex, value)
                                    }
                                    className="text-slate-700"
                                  />
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  <EditableText
                                    value={child.href}
                                    onCommit={(value) =>
                                      onChildHrefChange(index, childIndex, value)
                                    }
                                    className="text-slate-400"
                                  />
                                </div>
                              </div>
                              {child.children && child.children.length > 0 && (
                                <span className="text-slate-400 text-sm">›</span>
                              )}
                            </div>

                            {/* Sub-menu */}
                            {child.children && child.children.length > 0 && (
                              <div className="absolute left-full top-0 ml-1 w-56 rounded-xl bg-white p-2 text-slate-700 shadow-2xl border border-slate-200 opacity-0 invisible -translate-x-2 transition-all duration-200 group-hover/child:opacity-100 group-hover/child:visible group-hover/child:translate-x-0">
                                <div className="grid gap-1 text-sm">
                                  {child.children.map((subChild) => (
                                    <div
                                      key={subChild.id}
                                      className="rounded-lg px-3 py-2 hover:bg-slate-100 transition-colors cursor-pointer border-l-2 border-transparent hover:border-yellow-400"
                                    >
                                      <div className="font-medium text-slate-700">
                                        {getLabel(subChild.label)}
                                      </div>
                                      <div className="text-[10px] text-slate-400 mt-0.5">
                                        {subChild.href}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {/* Dropdown arrow pointer */}
                      <div className="absolute -top-2 left-4 w-4 h-4 bg-white border-l border-t border-slate-200 transform rotate-45"></div>
                    </div>
                  )}
                </div>
              ))}
              <div className="relative">
                <button
                  type="button"
                  className="flex h-10 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 text-[11px] font-semibold uppercase"
                  onClick={() => setLanguageOpen((prev) => !prev)}
                >
                  {activeLanguage}
                  <span className="text-[9px]">▾</span>
                </button>
                {languageOpen && (
                  <div className="absolute right-0 top-full z-10 mt-2 w-24 rounded-xl border border-slate-200 bg-white p-1 text-[10px] text-slate-700 shadow-xl">
                    {["th", "en"].map((lng) => (
                      <button
                        key={lng}
                        className={`w-full rounded-lg px-2 py-1 text-left uppercase ${
                          lng === activeLanguage ? "bg-slate-900 text-white" : "hover:bg-slate-100"
                        }`}
                      >
                        {lng}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="inline-flex items-center rounded-full bg-white px-5 py-2 text-[11px] font-semibold text-[#0b3c86]">
                Book
              </span>
            </div>
          </div>
          {mobileOpen && (
            <div className="border-t border-white/15 bg-[#0b3c86]/95 px-6 py-4 text-white md:hidden">
              <div className="grid gap-3 text-xs">
                {menu.items.map((item) => (
                  <div key={item.id} className="grid gap-1">
                    <span className="font-semibold">{getLabel(item.label)}</span>
                    {item.children && item.children.length > 0 && (
                      <div className="grid gap-1 border-l border-white/20 pl-3 text-[11px] text-white/80">
                        {item.children.map((child) => (
                          <div key={child.id}>
                            {getLabel(child.label)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MenuBuilder() {
  const [menu, setMenu] = useState<MenuData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<Language>("th");
  const sensors = useSensors(useSensor(PointerSensor));

  const toUploadPath = (value?: string) => {
    if (!value) return "";
    if (value.startsWith(API_URL)) {
      const trimmed = value.slice(API_URL.length);
      return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    }
    const uploadIndex = value.indexOf("/uploads/");
    if (uploadIndex !== -1) return value.slice(uploadIndex);
    return value;
  };

  const loadMenu = async () => {
    const response = await fetch(`${API_URL}/menu?admin=1`);
    const data = await response.json();
    const nextMenu = data.menu || null;
    setMenu(
      nextMenu
        ? {
            ...nextMenu,
            logoUrl: toUploadPath(nextMenu.logoUrl),
          }
        : null
    );
  };

  useEffect(() => {
    loadMenu();
  }, []);

  // Helper to extract language-specific string
  const getLocalizedString = (value: MultiLangString | undefined): string => {
    return getLangString(value, activeLanguage);
  };

  // Helper to update multi-language string
  const updateMultiLangString = (
    current: MultiLangString | undefined,
    newValue: string
  ): MultiLangString => {
    if (!current || typeof current === "string") {
      // Convert from string to multi-lang
      return {
        th: activeLanguage === "th" ? newValue : (current as string) || "",
        en: activeLanguage === "en" ? newValue : "",
      };
    }
    // Update existing multi-lang
    return { ...current, [activeLanguage]: newValue };
  };

  const addItem = () => {
    if (!menu) return;
    setMenu({
      ...menu,
      items: [
        ...menu.items,
        { id: crypto.randomUUID(), label: { th: "เมนูใหม่", en: "New Item" }, href: "/", children: [] },
      ],
    });
  };

  const updateItem = (index: number, patch: Partial<MenuItem>) => {
    if (!menu) return;
    const next = [...menu.items];
    next[index] = { ...next[index], ...patch };
    setMenu({ ...menu, items: next });
  };

  const removeItem = (index: number) => {
    if (!menu) return;
    const next = [...menu.items];
    next.splice(index, 1);
    setMenu({ ...menu, items: next });
  };

  const addChild = (index: number) => {
    if (!menu) return;
    const next = [...menu.items];
    const children = [...(next[index].children || [])];
    children.push({
      id: crypto.randomUUID(),
      label: { th: "เมนูย่อยใหม่", en: "New Child" },
      href: "/",
    });
    next[index] = { ...next[index], children };
    setMenu({ ...menu, items: next });
  };

  const updateChild = (
    index: number,
    childIndex: number,
    patch: Partial<MenuItem>
  ) => {
    if (!menu) return;
    const next = [...menu.items];
    const children = [...(next[index].children || [])];
    children[childIndex] = { ...children[childIndex], ...patch };
    next[index] = { ...next[index], children };
    setMenu({ ...menu, items: next });
  };

  const removeChild = (index: number, childIndex: number) => {
    if (!menu) return;
    const next = [...menu.items];
    const children = [...(next[index].children || [])];
    children.splice(childIndex, 1);
    next[index] = { ...next[index], children };
    setMenu({ ...menu, items: next });
  };

  const addSubChild = (index: number, childIndex: number) => {
    if (!menu) return;
    const next = [...menu.items];
    const children = [...(next[index].children || [])];
    const subChildren = [...(children[childIndex].children || [])];
    subChildren.push({
      id: crypto.randomUUID(),
      label: { th: "เมนูย่อยระดับ 2", en: "New Sub-item" },
      href: "/",
    });
    children[childIndex] = { ...children[childIndex], children: subChildren };
    next[index] = { ...next[index], children };
    setMenu({ ...menu, items: next });
  };

  const updateSubChild = (
    index: number,
    childIndex: number,
    subChildIndex: number,
    patch: Partial<MenuItem>
  ) => {
    if (!menu) return;
    const next = [...menu.items];
    const children = [...(next[index].children || [])];
    const subChildren = [...(children[childIndex].children || [])];
    subChildren[subChildIndex] = { ...subChildren[subChildIndex], ...patch };
    children[childIndex] = { ...children[childIndex], children: subChildren };
    next[index] = { ...next[index], children };
    setMenu({ ...menu, items: next });
  };

  const removeSubChild = (index: number, childIndex: number, subChildIndex: number) => {
    if (!menu) return;
    const next = [...menu.items];
    const children = [...(next[index].children || [])];
    const subChildren = [...(children[childIndex].children || [])];
    subChildren.splice(subChildIndex, 1);
    children[childIndex] = { ...children[childIndex], children: subChildren };
    next[index] = { ...next[index], children };
    setMenu({ ...menu, items: next });
  };

  // Contact Bar Management
  const addContactItem = () => {
    if (!menu) return;
    const contactBar = menu.contactBar || {
      enabled: true,
      backgroundColor: "#f8f9fa",
      textColor: "#000000",
      items: [],
    };
    contactBar.items.push({
      id: crypto.randomUUID(),
      icon: "📞",
      text: { th: "ติดต่อใหม่", en: "New Contact" },
      link: "",
    });
    setMenu({ ...menu, contactBar });
  };

  const updateContactItem = (index: number, patch: Partial<ContactBarItem>) => {
    if (!menu || !menu.contactBar) return;
    const items = [...menu.contactBar.items];
    items[index] = { ...items[index], ...patch };
    setMenu({ ...menu, contactBar: { ...menu.contactBar, items } });
  };

  const removeContactItem = (index: number) => {
    if (!menu || !menu.contactBar) return;
    const items = [...menu.contactBar.items];
    items.splice(index, 1);
    setMenu({ ...menu, contactBar: { ...menu.contactBar, items } });
  };

  const toggleContactBar = () => {
    if (!menu) return;
    const contactBar = menu.contactBar || {
      enabled: false,
      backgroundColor: "#f8f9fa",
      textColor: "#000000",
      items: [],
    };
    setMenu({ ...menu, contactBar: { ...contactBar, enabled: !contactBar.enabled } });
  };

  const onDragEnd = (event: DragEndEvent) => {
    if (!menu || !event.over) return;
    const oldIndex = menu.items.findIndex((item) => item.id === event.active.id);
    const newIndex = menu.items.findIndex((item) => item.id === event.over?.id);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    setMenu({ ...menu, items: arrayMove(menu.items, oldIndex, newIndex) });
  };

  const saveMenu = async () => {
    if (!menu) return;
    await fetch(`${API_URL}/menu`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: menu.items,
        cta: menu.cta,
        logoUrl: toUploadPath(menu.logoUrl),
        contactBar: menu.contactBar,
      }),
    });
    Swal.fire({
      icon: "success",
      title: "Menu Saved!",
      toast: true,
      position: "bottom-end",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  };

  const uploadLogo = async (file: File) => {
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
    return toUploadPath(data.url as string);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Navbar</h1>
          <p className="text-sm text-slate-500">
            จัดการเมนูหลักและเมนูย่อยแบบ dropdown
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={addItem}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold"
          >
            + Add Item
          </button>
          <button
            onClick={saveMenu}
            className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow"
          >
            Save
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {!menu ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : (
          <div className="grid gap-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow">
              <LanguageTabs
                activeLanguage={activeLanguage}
                onLanguageChange={setActiveLanguage}
              />
            </div>

            <NavbarPreview
              menu={menu}
              activeLanguage={activeLanguage}
              onItemLabelChange={(index, value) =>
                updateItem(index, { label: updateMultiLangString(menu.items[index].label, value) })
              }
              onItemHrefChange={(index, value) =>
                updateItem(index, { href: value })
              }
              onChildLabelChange={(index, childIndex, value) =>
                updateChild(index, childIndex, { label: updateMultiLangString(menu.items[index].children?.[childIndex]?.label, value) })
              }
              onChildHrefChange={(index, childIndex, value) =>
                updateChild(index, childIndex, { href: value })
              }
              onCtaLabelChange={(value) =>
                setMenu({
                  ...menu,
                  cta: { label: updateMultiLangString(menu.cta?.label, value), href: menu.cta?.href || "" },
                })
              }
              onCtaHrefChange={(value) =>
                setMenu({
                  ...menu,
                  cta: { label: menu.cta?.label || "", href: value },
                })
              }
            />

            {/* Contact Bar Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contact Bar (Top of Page)
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={menu.contactBar?.enabled || false}
                    onChange={toggleContactBar}
                    className="rounded"
                  />
                  <span className="text-xs font-medium text-slate-600">Enable</span>
                </label>
              </div>

              {menu.contactBar?.enabled && (
                <>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 mb-4">
                    <div>
                      <label className="text-xs text-slate-600 mb-1 block">Background Color</label>
                      <input
                        type="color"
                        className="h-10 w-full rounded-lg border border-slate-200"
                        value={menu.contactBar.backgroundColor || "#f8f9fa"}
                        onChange={(event) =>
                          setMenu({
                            ...menu,
                            contactBar: { ...menu.contactBar!, backgroundColor: event.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 mb-1 block">Text Color</label>
                      <input
                        type="color"
                        className="h-10 w-full rounded-lg border border-slate-200"
                        value={menu.contactBar.textColor || "#000000"}
                        onChange={(event) =>
                          setMenu({
                            ...menu,
                            contactBar: { ...menu.contactBar!, textColor: event.target.value },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Contact Items
                    </p>
                    <button
                      onClick={addContactItem}
                      className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[10px] font-semibold"
                    >
                      + Add Item
                    </button>
                  </div>

                  <div className="grid gap-2">
                    {(menu.contactBar.items || []).map((item, index) => (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-3"
                      >
                        <input
                          className="w-16 rounded border border-slate-300 bg-white px-2 py-1.5 text-center text-sm"
                          value={item.icon}
                          onChange={(event) =>
                            updateContactItem(index, { icon: event.target.value })
                          }
                          placeholder="📞"
                          maxLength={2}
                        />
                        <input
                          className="flex-1 rounded border border-slate-300 bg-white px-3 py-1.5 text-sm"
                          value={getLocalizedString(item.text)}
                          onChange={(event) =>
                            updateContactItem(index, { text: updateMultiLangString(item.text, event.target.value) })
                          }
                          placeholder="Contact text"
                        />
                        <input
                          className="flex-1 rounded border border-slate-300 bg-white px-3 py-1.5 text-sm"
                          value={item.link || ""}
                          onChange={(event) =>
                            updateContactItem(index, { link: event.target.value })
                          }
                          placeholder="Link (optional)"
                        />
                        <button
                          onClick={() => removeContactItem(index)}
                          className="rounded bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                    {(!menu.contactBar.items || menu.contactBar.items.length === 0) && (
                      <p className="text-xs text-slate-400 text-center py-2">
                        No contact items. Click "+ Add Item" to create one.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Navbar CTA
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={getLocalizedString(menu.cta?.label)}
                  onChange={(event) =>
                    setMenu({
                      ...menu,
                      cta: { label: updateMultiLangString(menu.cta?.label, event.target.value), href: menu.cta?.href || "" },
                    })
                  }
                  placeholder="Button Label"
                />
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={menu.cta?.href || ""}
                  onChange={(event) =>
                    setMenu({
                      ...menu,
                      cta: { label: menu.cta?.label || { th: "", en: "" }, href: event.target.value },
                    })
                  }
                  placeholder="/contact or #booking"
                />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Navbar Logo
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-[120px_1fr] sm:items-center">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  {menu.logoUrl ? (
                    <img
                      src={resolveUploadUrl(menu.logoUrl)}
                      alt="Logo preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400">Logo</span>
                  )}
                </div>
                <div className="grid gap-2">
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={menu.logoUrl || ""}
                    onChange={(event) =>
                      setMenu({ ...menu, logoUrl: event.target.value })
                    }
                    placeholder="Logo URL"
                  />
                  <label className="w-fit rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                    {uploading ? "Uploading..." : "Upload Logo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        const url = await uploadLogo(file);
                        if (url) setMenu({ ...menu, logoUrl: url });
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={menu.items.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {menu.items.map((item, index) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    activeLanguage={activeLanguage}
                    onChange={(patch) => updateItem(index, patch)}
                    onRemove={() => removeItem(index)}
                    onAddChild={() => addChild(index)}
                    onChangeChild={(childIndex, patch) =>
                      updateChild(index, childIndex, patch)
                    }
                    onRemoveChild={(childIndex) =>
                      removeChild(index, childIndex)
                    }
                    onAddSubChild={(childIndex) =>
                      addSubChild(index, childIndex)
                    }
                    onChangeSubChild={(childIndex, subChildIndex, patch) =>
                      updateSubChild(index, childIndex, subChildIndex, patch)
                    }
                    onRemoveSubChild={(childIndex, subChildIndex) =>
                      removeSubChild(index, childIndex, subChildIndex)
                    }
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>
    </div>
  );
}
