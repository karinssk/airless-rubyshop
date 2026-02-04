"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
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
import withReactContent from "sweetalert2-react-content";

type MenuItem = {
  id: string;
  label: string;
  href: string;
  icon?: string;
  permission?: "everyone" | "owner-only";
  children?: MenuItem[];
};

type MenuData = {
  name: string;
  items: MenuItem[];
};

const API_URL = backendBaseUrl;

const emptyMenu: MenuData = {
  name: "main",
  items: [],
};

const MySwal = withReactContent(Swal);

function SortableRow({
  item,
  onLabelChange,
  onHrefChange,
  onIconChange,
  onPermissionChange,
  onRemove,
  onAddChild,
  onChildChange,
  onChildRemove,
  onReorderChildren,
  sensors,
  onUploadIcon,
}: {
  item: MenuItem;
  onLabelChange: (value: string) => void;
  onHrefChange: (value: string) => void;
  onIconChange: (value: string) => void;
  onPermissionChange: (value: "everyone" | "owner-only") => void;
  onRemove: () => void;
  onAddChild: () => void;
  onChildChange: (childIndex: number, patch: Partial<MenuItem>) => void;
  onChildRemove: (childIndex: number) => void;
  onReorderChildren: (next: MenuItem[]) => void;
  sensors: ReturnType<typeof useSensors>;
  onUploadIcon: (file: File) => Promise<string>;
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
      className="rounded-3xl border border-slate-300 bg-white p-5 shadow-md"
    >
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="cursor-grab rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
          {...attributes}
          {...listeners}
        >
          Drag
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
            {item.icon ? (
              <img
                src={resolveUploadUrl(item.icon)}
                alt=""
                className="h-6 w-6 object-contain"
              />
            ) : (
              <span className="text-[10px] font-semibold text-slate-400">
                Icon
              </span>
            )}
          </div>
          <label className="rounded-full border border-slate-300 bg-slate-900 px-3 py-1 text-[10px] text-white shadow-sm">
            Upload
            <input
              type="file"
              accept="image/svg+xml,image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUploadIcon(file);
              }}
            />
          </label>
        </div>
        <input
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
          value={item.label}
          placeholder="Label"
          onChange={(event) => onLabelChange(event.target.value)}
        />
        <input
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
          value={item.href}
          placeholder="Href (leave empty for group)"
          onChange={(event) => onHrefChange(event.target.value)}
        />
        <input
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
          value={item.icon || ""}
          placeholder="Icon URL (optional)"
          onChange={(event) => onIconChange(event.target.value)}
        />
        <select
          value={item.permission || "everyone"}
          onChange={(event) =>
            onPermissionChange(event.target.value as "everyone" | "owner-only")
          }
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm"
        >
          <option value="everyone">Everyone</option>
          <option value="owner-only">Owner only</option>
        </select>
        <button
          onClick={onRemove}
          className="rounded-full bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700"
        >
          Delete
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-300 bg-slate-100 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Nested Items
          </p>
          <button
            onClick={onAddChild}
            className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"
          >
            + Add
          </button>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event: DragEndEvent) => {
            if (!event.over) return;
            const children = item.children || [];
            const activeId = String(event.active.id);
            const overId = String(event.over?.id);
            const oldIndex = children.findIndex(
              (child) => child.id === activeId
            );
            const newIndex = children.findIndex(
              (child) => child.id === overId
            );
            if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
              return;
            }
            onReorderChildren(arrayMove(children, oldIndex, newIndex));
          }}
        >
          <SortableContext
            items={(item.children || []).map((child) => child.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="mt-3 grid gap-2">
                  {(item.children || []).map((child, childIndex) => (
                    <SortableChildRow
                      key={child.id}
                      child={child}
                      onChange={(patch) => onChildChange(childIndex, patch)}
                      onRemove={() => onChildRemove(childIndex)}
                      onUploadIcon={async (file) => {
                        const url = await onUploadIcon(file);
                        onChildChange(childIndex, { icon: url });
                        return url;
                      }}
                    />
                  ))}
              {(item.children || []).length === 0 && (
                <p className="text-xs text-slate-400">No nested items.</p>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

function SortableChildRow({
  child,
  onChange,
  onRemove,
  onUploadIcon,
}: {
  child: MenuItem;
  onChange: (patch: Partial<MenuItem>) => void;
  onRemove: () => void;
  onUploadIcon: (file: File) => Promise<string>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: child.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <button
        className="cursor-grab rounded-full bg-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600"
        {...attributes}
        {...listeners}
      >
        Drag
      </button>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
          {child.icon ? (
            <img
              src={resolveUploadUrl(child.icon)}
              alt=""
              className="h-5 w-5 object-contain"
            />
          ) : (
            <span className="text-[9px] font-semibold text-slate-400">
              Icon
            </span>
          )}
        </div>
        <label className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[9px] text-slate-500 shadow-sm">
          Upload
          <input
            type="file"
            accept="image/svg+xml,image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUploadIcon(file);
            }}
          />
        </label>
      </div>
      <input
        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm"
        value={child.label}
        placeholder="Label"
        onChange={(event) => onChange({ label: event.target.value })}
      />
      <input
        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm"
        value={child.href}
        placeholder="Href"
        onChange={(event) => onChange({ href: event.target.value })}
      />
      <input
        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm"
        value={child.icon || ""}
        placeholder="Icon URL"
        onChange={(event) => onChange({ icon: event.target.value })}
      />
      <select
        value={child.permission || "everyone"}
        onChange={(event) =>
          onChange({
            permission: event.target.value as "everyone" | "owner-only",
          })
        }
        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold text-slate-600 shadow-sm"
      >
        <option value="everyone">Everyone</option>
        <option value="owner-only">Owner only</option>
      </select>
      <button
        onClick={onRemove}
        className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700"
      >
        Delete
      </button>
    </div>
  );
}

export default function AdminMenuPage() {
  const [menu, setMenu] = useState<MenuData>(emptyMenu);
  const [message, setMessage] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  const loadMenu = async () => {
    const response = await fetch(`${API_URL}/admin-menu`);
    const data = await response.json();
    setMenu(data.menu || emptyMenu);
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const updateItem = (index: number, patch: Partial<MenuItem>) => {
    const next = [...menu.items];
    next[index] = { ...next[index], ...patch };
    setMenu({ ...menu, items: next });
  };

  const removeItem = (index: number) => {
    const next = [...menu.items];
    next.splice(index, 1);
    setMenu({ ...menu, items: next });
  };

  const addItem = () => {
    setMenu({
      ...menu,
      items: [
        ...menu.items,
        {
          id: crypto.randomUUID(),
          label: "New Item",
          href: "",
          icon: "",
          permission: "everyone",
        },
      ],
    });
  };

  const addChild = (index: number) => {
    const next = [...menu.items];
    const children = next[index].children || [];
    children.push({
      id: crypto.randomUUID(),
      label: "New Sub Item",
      href: "",
      icon: "",
      permission: "everyone",
    });
    next[index] = { ...next[index], children };
    setMenu({ ...menu, items: next });
  };

  const updateChild = (
    index: number,
    childIndex: number,
    patch: Partial<MenuItem>
  ) => {
    const next = [...menu.items];
    const children = [...(next[index].children || [])];
    children[childIndex] = { ...children[childIndex], ...patch };
    next[index] = { ...next[index], children };
    setMenu({ ...menu, items: next });
  };

  const removeChild = (index: number, childIndex: number) => {
    const next = [...menu.items];
    const children = [...(next[index].children || [])];
    children.splice(childIndex, 1);
    next[index] = { ...next[index], children };
    setMenu({ ...menu, items: next });
  };

  const saveMenu = async () => {
    const response = await fetch(`${API_URL}/admin-menu`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: menu.items }),
    });
    if (response.ok) {
      setMessage("Saved");
      setTimeout(() => setMessage(null), 1200);
      window.localStorage.setItem("adminMenuCache", JSON.stringify(menu.items));
      window.localStorage.setItem("adminMenuCacheTime", String(Date.now()));
      MySwal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Menu saved",
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true,
      });
    }
  };

  const uploadIcon = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_URL}/uploads`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("Upload failed");
    const data = await response.json();
    return data.url as string;
  };

  const onDragEnd = (event: DragEndEvent) => {
    if (!event.over) return;
    const activeId = String(event.active.id);
    const overId = String(event.over?.id);
    const oldIndex = menu.items.findIndex((item) => item.id === activeId);
    const newIndex = menu.items.findIndex((item) => item.id === overId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    setMenu({ ...menu, items: arrayMove(menu.items, oldIndex, newIndex) });
  };

  return (
    <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-slate-50/70 p-8 shadow-xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Admin Sidebar Menu
            </h2>
            <p className="text-sm text-slate-500">
              สร้างกลุ่มเมนูและเมนูย่อยสำหรับแถบซ้าย
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={addItem}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm"
            >
              + Add Item
            </button>
            <button
              onClick={saveMenu}
              className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm"
            >
              Save
            </button>
            {message && (
              <span className="text-xs text-emerald-600">{message}</span>
            )}
          </div>
        </header>

        <div className="mt-6 grid gap-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={menu.items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid gap-4">
                {menu.items.map((item, index) => (
                  <SortableRow
                    key={item.id}
                    item={item}
                    onLabelChange={(value) => updateItem(index, { label: value })}
                    onHrefChange={(value) => updateItem(index, { href: value })}
                    onIconChange={(value) => updateItem(index, { icon: value })}
                    onPermissionChange={(value) =>
                      updateItem(index, { permission: value })
                    }
                    onRemove={() => removeItem(index)}
                    onAddChild={() => addChild(index)}
                    onChildChange={(childIndex, patch) =>
                      updateChild(index, childIndex, patch)
                    }
                    onChildRemove={(childIndex) =>
                      removeChild(index, childIndex)
                    }
                    onReorderChildren={(next) =>
                      updateItem(index, { children: next })
                    }
                    sensors={sensors}
                    onUploadIcon={async (file) => {
                      const url = await uploadIcon(file);
                      updateItem(index, { icon: url });
                      return url;
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {menu.items.length === 0 && (
            <p className="text-sm text-slate-400">
              ยังไม่มีเมนู ลองกด Add Item เพื่อสร้างเมนูใหม่
            </p>
          )}
        </div>
    </div>
  );
}
