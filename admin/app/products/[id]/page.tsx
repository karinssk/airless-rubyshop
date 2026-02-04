"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Bold,
    ChevronLeft,
    Image as ImageIcon,
    Italic,
    List,
    ListOrdered,
    Underline as UnderlineIcon,
} from "lucide-react";
import { backendBaseUrl, resolveUploadUrl } from "@/lib/urls";
import { LanguageTabs } from "../../pages/builder/LanguageTabs";
import type { MultiLangString, Language } from "../types";
import { getLangString } from "../types";

const MySwal = withReactContent(Swal);

const Toast = MySwal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    },
});

const API_URL = backendBaseUrl;

const slugify = (value: string) =>
    String(value || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\u0E00-\u0E7F]+/g, "-")
        .replace(/(^-|-$)+/g, "");

const ResizableImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            style: { default: null },
        };
    },
});

type ProductCategory = {
    id: string;
    name: string;
};

function InlineEditableText({
    value,
    onCommit,
    className,
    placeholder,
    hoverClassName = "hover:bg-slate-100",
}: {
    value: string;
    onCommit: (next: string) => void;
    className?: string;
    placeholder?: string;
    hoverClassName?: string;
}) {
    return (
        <span
            className={`inline-block rounded-md px-1 transition ${hoverClassName} focus:outline-none focus:ring-2 focus:ring-blue-200 ${className || ""
                }`}
            contentEditable
            suppressContentEditableWarning
            onKeyDown={(event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    (event.currentTarget as HTMLElement).blur();
                }
            }}
            onBlur={(event) =>
                onCommit(event.currentTarget.textContent?.trim() || "")
            }
            data-placeholder={placeholder}
        >
            {value || placeholder || ""}
        </span>
    );
}

type CompareCell = {
    value: string;
    href?: string;
};

type CompareTable = {
    heading: string;
    subheading?: string;
    columns: string[];
    rows: CompareCell[][];
};

type ProductForm = {
    id?: string;
    name: MultiLangString;
    slug: string;
    code: string;
    btu: string;
    status: string;
    categoryId?: string | null;
    description: Record<string, any>;
    features: Record<string, MultiLangString>;
    highlights: MultiLangString[];
    inBox: MultiLangString[];
    warranty: { device: MultiLangString; compressor: MultiLangString };
    price: { device: number; installation: number; total: number };
    images: string[];
    seo: { title: MultiLangString; description: MultiLangString; image: string };
    compareTable: CompareTable;
};

const emptyProduct = (): ProductForm => ({
    name: { th: "", en: "" },
    slug: "",
    code: "",
    btu: "",
    status: "draft",
    categoryId: null,
    description: { type: "doc", content: [{ type: "paragraph" }] },
    features: {},
    highlights: [],
    inBox: [],
    warranty: { device: { th: "", en: "" }, compressor: { th: "", en: "" } },
    price: { device: 0, installation: 0, total: 0 },
    images: [],
    seo: { title: { th: "", en: "" }, description: { th: "", en: "" }, image: "" },
    compareTable: {
        heading: "",
        subheading: "",
        columns: [],
        rows: [],
    },
});

export default function ProductDetailPage() {
    const router = useRouter();
    const params = useParams();
    const productId =
        typeof params?.id === "string"
            ? params.id
            : Array.isArray(params?.id)
                ? params.id[0]
                : "";
    const isNew = productId === "new";
    const [product, setProduct] = useState<ProductForm | null>(
        isNew ? emptyProduct() : null
    );
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [newFeatureKey, setNewFeatureKey] = useState("");
    const [newFeatureValue, setNewFeatureValue] = useState("");
    const [uploading, setUploading] = useState(false);
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

    // Helper for arrays
    const updateMultiLangArray = (
        arr: MultiLangString[],
        index: number,
        newValue: string
    ): MultiLangString[] => {
        const updated = [...arr];
        updated[index] = updateMultiLangString(updated[index], newValue);
        return updated;
    };

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextStyle,
            Color,
            Link.configure({ openOnClick: false }),
            ResizableImage.configure({ inline: false }),
            Placeholder.configure({ placeholder: "Type product description..." }),
            TextAlign.configure({ types: ["heading", "paragraph"] }),
        ],
        content: product?.description || emptyProduct().description,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class:
                    "prose prose-slate max-w-none focus:outline-none prose-headings:text-slate-900 prose-p:text-slate-700",
            },
        },
    });

    useEffect(() => {
        if (!editor || !product?.description) return;
        editor.commands.setContent(product.description);
    }, [product?.description, editor]);

    useEffect(() => {
        if (!API_URL) return;
        const load = async () => {
            const categoryResponse = await fetch(`${API_URL}/product-categories`);
            if (categoryResponse.ok) {
                const data = await categoryResponse.json();
                setCategories(data.categories || []);
            }
            if (isNew) {
                setProduct((prev) => prev || emptyProduct());
                return;
            }
            if (!productId) return;
            const response = await fetch(
                `${API_URL}/products/${productId}?preview=1`
            );
            if (!response.ok) return;
            const data = await response.json();
            if (data?.product) {
                const loaded = data.product;
                setProduct({
                    ...emptyProduct(),
                    ...loaded,
                    categoryId: loaded.category?.id || loaded.categoryId || null,
                    compareTable:
                        loaded.compareTable || emptyProduct().compareTable,
                });
            }
        };
        load();
    }, [isNew, productId]);

    const updateProduct = (patch: Partial<ProductForm>) => {
        setProduct((prev) => (prev ? { ...prev, ...patch } : prev));
    };

    const normalizeCompareRows = (
        rows: CompareCell[][],
        columnCount: number
    ) =>
        rows.map((row) => {
            const next = [...row];
            if (next.length > columnCount) {
                return next.slice(0, columnCount);
            }
            while (next.length < columnCount) {
                next.push({ value: "", href: "" });
            }
            return next;
        });

    const updateCompareTable = (patch: Partial<CompareTable>) => {
        if (!product) return;
        const next = { ...product.compareTable, ...patch };
        updateProduct({ compareTable: next });
    };

    const updateCompareColumns = (columns: string[]) => {
        if (!product) return;
        const nextRows = normalizeCompareRows(
            product.compareTable.rows || [],
            columns.length
        );
        updateProduct({
            compareTable: { ...product.compareTable, columns, rows: nextRows },
        });
    };

    const updateCompareCell = (
        rowIndex: number,
        colIndex: number,
        patch: Partial<CompareCell>
    ) => {
        if (!product) return;
        const rows = product.compareTable.rows.map((row, rIndex) =>
            rIndex === rowIndex
                ? row.map((cell, cIndex) =>
                    cIndex === colIndex ? { ...cell, ...patch } : cell
                )
                : row
        );
        updateCompareTable({ rows });
    };

    const addCompareColumn = () => {
        if (!product) return;
        const nextColumns = [...product.compareTable.columns, "New Column"];
        updateCompareColumns(nextColumns);
    };

    const removeCompareColumn = (index: number) => {
        if (!product) return;
        const nextColumns = product.compareTable.columns.filter(
            (_col, idx) => idx !== index
        );
        const nextRows = (product.compareTable.rows || []).map((row) =>
            row.filter((_cell, idx) => idx !== index)
        );
        updateProduct({
            compareTable: {
                ...product.compareTable,
                columns: nextColumns,
                rows: nextRows,
            },
        });
    };

    const addCompareRow = () => {
        if (!product) return;
        const row = product.compareTable.columns.map(() => ({
            value: "",
            href: "",
        }));
        updateCompareTable({
            rows: [...product.compareTable.rows, row],
        });
    };

    const removeCompareRow = (index: number) => {
        if (!product) return;
        updateCompareTable({
            rows: product.compareTable.rows.filter((_row, idx) => idx !== index),
        });
    };

    const uploadImage = async (file: File) => {
        if (!API_URL) return "";
        const formData = new FormData();
        formData.append("file", file);
        setUploading(true);
        const response = await fetch(`${API_URL}/uploads`, {
            method: "POST",
            body: formData,
        });
        setUploading(false);
        if (!response.ok) return "";
        const data = await response.json();
        return data.url as string;
    };

const saveProduct = async () => {
    if (!product || !API_URL || !editor) return;

    // Validate
    if (!product.name) {
        Toast.fire({
            icon: "warning",
            title: "Product name is required",
        });
        return;
    }

    const payload = {
        ...product,
        description: editor.getJSON(),
    };
    payload.price.total = Number(payload.price.device || 0) + Number(payload.price.installation || 0);
    console.log("[Product Save] Payload", payload);

    try {
        const method = isNew ? "POST" : "PUT";
        const url = isNew ? `${API_URL}/products` : `${API_URL}/products/${product.id}`;

        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("Failed to save");

        const data = await response.json();
        console.log("[Product Save] Response", data);

        if (data.product?.id) {
            Toast.fire({
                icon: "success",
                title: "Saved successfully",
            });
            if (isNew) {
                router.replace(`/products/${data.product.id}`);
            }
        }
    } catch (e) {
        Toast.fire({
            icon: "error",
            title: "Error saving product",
        });
    }
};

const deleteProduct = async () => {
    if (!product?.id || !API_URL) return;
    if (!confirm("Delete this product?")) return;
    await fetch(`${API_URL}/products/${product.id}`, { method: "DELETE" });
    router.push("/products");
};

const addFeature = () => {
    if (!newFeatureKey || !newFeatureValue || !product) return;
    updateProduct({
        features: {
            ...product.features,
            [newFeatureKey]: updateMultiLangString(undefined, newFeatureValue)
        }
    });
    setNewFeatureKey("");
    setNewFeatureValue("");
};

const removeFeature = (key: string) => {
    if (!product) return;
    const next = { ...product.features };
    delete next[key];
    updateProduct({ features: next });
};

const toolbarButtonClass = (active?: boolean) =>
    `inline-flex h-8 w-8 items-center justify-center rounded-md border text-xs font-semibold transition ${active
        ? "border-blue-700 bg-blue-700 text-white shadow-sm"
        : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:text-slate-900"
    }`;


if (!product) return <div>Loading...</div>;

return (
        <div className="mx-auto max-w-5xl">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur z-10 py-4 border-b border-slate-200/50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            {isNew ? "Create Product" : getLabel(product.name)}
                        </h1>
                        <p className="text-xs text-slate-500">{isNew ? "Add a new item to catalog" : product.id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">

                    {!isNew && (
                        <button
                            onClick={deleteProduct}
                            className="rounded-full bg-rose-100 px-6 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-200"
                        >
                            Delete
                        </button>
                    )}
                    <button
                        onClick={saveProduct}
                        className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:bg-blue-700"
                    >
                        {isNew ? "Create Product" : "Save Changes"}
                    </button>
                </div>
            </div>

            {/* Language Tabs */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
                <LanguageTabs
                    activeLanguage={activeLanguage}
                    onLanguageChange={setActiveLanguage}
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                {/* Main Column */}
                <div className="space-y-6">

                    {/* Basic Info */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">Basic Information</h2>
                        <div className="grid gap-4">
                            <label className="grid gap-1.5 text-sm text-slate-700">
                                <span className="font-semibold">Product Name</span>
                                <input
                                    className="rounded-xl border border-slate-200 px-4 py-2.5"
                                    value={getLabel(product.name)}
                                    onChange={e => updateProduct({
                                        name: updateMultiLangString(product.name, e.target.value),
                                        slug: isNew ? slugify(e.target.value) : product.slug
                                    })}
                                />
                            </label>
                            <div className="grid md:grid-cols-2 gap-4">
                                <label className="grid gap-1.5 text-sm text-slate-700">
                                    <span className="font-semibold">Slug</span>
                                    <input
                                        className="rounded-xl border border-slate-200 px-4 py-2.5 bg-slate-50 text-slate-500"
                                        value={product.slug}
                                        onChange={e => updateProduct({ slug: slugify(e.target.value) })}
                                    />
                                </label>
                                <label className="grid gap-1.5 text-sm text-slate-700">
                                    <span className="font-semibold">Model Code / SKU</span>
                                    <input
                                        className="rounded-xl border border-slate-200 px-4 py-2.5"
                                        value={product.code}
                                        onChange={e => updateProduct({ code: e.target.value })}
                                    />
                                </label>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <label className="grid gap-1.5 text-sm text-slate-700">
                                    <span className="font-semibold">Category</span>
                                    <select
                                        className="rounded-xl border border-slate-200 px-4 py-2.5"
                                        value={product.categoryId || ""}
                                        onChange={e => updateProduct({ categoryId: e.target.value || null })}
                                    >
                                        <option value="">Uncategorized</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </label>
                                <label className="grid gap-1.5 text-sm text-slate-700">
                                    <span className="font-semibold">BTU</span>
                                    <input
                                        className="rounded-xl border border-slate-200 px-4 py-2.5"
                                        value={product.btu}
                                        onChange={e => updateProduct({ btu: e.target.value })}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Images */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">Images</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {product.images.map((img, idx) => (
                                <div key={idx} className="relative group aspect-square rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                                    <img src={resolveUploadUrl(img)} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => updateProduct({ images: product.images.filter((_, i) => i !== idx) })}
                                        className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-rose-500 shadow-sm opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ))}
                            <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:bg-slate-50 cursor-pointer transition">
                                <span className="text-xs text-slate-500 font-medium">Add Image</span>
                                <input type="file" multiple accept="image/*" className="hidden" onChange={async e => {
                                    const files = Array.from(e.target.files || []);
                                    if (!files.length) return;
                                    const urls = await Promise.all(files.map(uploadImage));
                                    updateProduct({ images: [...product.images, ...urls.filter(Boolean) as string[]] });
                                }} />
                            </label>
                        </div>
                    </div>

                    {/* Description Editor */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">Description</h2>
                        {/* Toolbar */}
                        <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-2">
                            <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} className={toolbarButtonClass(editor?.isActive("bold"))}><Bold className="w-4 h-4" /></button>
                            <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} className={toolbarButtonClass(editor?.isActive("italic"))}><Italic className="w-4 h-4" /></button>
                            <button type="button" onClick={() => editor?.chain().focus().toggleUnderline().run()} className={toolbarButtonClass(editor?.isActive("underline"))}><UnderlineIcon className="w-4 h-4" /></button>
                            <span className="w-px h-6 bg-slate-300 mx-1 self-center" />
                            <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={toolbarButtonClass(editor?.isActive("bulletList"))}><List className="w-4 h-4" /></button>
                            <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={toolbarButtonClass(editor?.isActive("orderedList"))}><ListOrdered className="w-4 h-4" /></button>
                            <span className="w-px h-6 bg-slate-300 mx-1 self-center" />
                            <button type="button" onClick={() => editor?.chain().focus().setTextAlign("left").run()} className={toolbarButtonClass(editor?.isActive({ textAlign: "left" }))}><AlignLeft className="w-4 h-4" /></button>
                            <button type="button" onClick={() => editor?.chain().focus().setTextAlign("center").run()} className={toolbarButtonClass(editor?.isActive({ textAlign: "center" }))}><AlignCenter className="w-4 h-4" /></button>
                            <button type="button" onClick={() => editor?.chain().focus().setTextAlign("right").run()} className={toolbarButtonClass(editor?.isActive({ textAlign: "right" }))}><AlignRight className="w-4 h-4" /></button>
                            <span className="w-px h-6 bg-slate-300 mx-1 self-center" />
                            <label className={toolbarButtonClass()}><ImageIcon className="w-4 h-4" />
                                <input type="file" className="hidden" accept="image/*" onChange={async e => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const url = await uploadImage(file);
                                        if (url) editor?.chain().focus().setImage({ src: resolveUploadUrl(url) }).run();
                                    }
                                }} />
                            </label>
                        </div>
                        <EditorContent editor={editor} className="min-h-[300px]" />
                    </div>

                    {/* Compare Table */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-800">Compare Table</h2>
                            <button
                                onClick={addCompareRow}
                                className="rounded-full bg-slate-800 px-4 py-2 text-xs font-semibold text-white"
                            >
                                + Add Row
                            </button>
                        </div>
                        <div className="grid gap-4">
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold text-[var(--brand-navy)]">
                                        <InlineEditableText
                                            value={product.compareTable.heading}
                                            placeholder="Compare Table Heading"
                                            onCommit={(value) =>
                                                updateCompareTable({ heading: value })
                                            }
                                        />
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        <InlineEditableText
                                            value={product.compareTable.subheading || ""}
                                            placeholder="Compare Table Subheading"
                                            onCommit={(value) =>
                                                updateCompareTable({ subheading: value })
                                            }
                                        />
                                    </p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm border border-slate-200 border-collapse">
                                        <thead className="bg-[#0b66b2] text-white">
                                            <tr>
                                                {product.compareTable.columns.map((column, colIndex) => (
                                                    <th
                                                        key={`preview-col-${colIndex}`}
                                                        className="px-4 py-3 text-left font-semibold border border-[#0b66b2]"
                                                    >
                                                        <InlineEditableText
                                                            value={column}
                                                            placeholder={`Column ${colIndex + 1}`}
                                                            onCommit={(value) => {
                                                                const next = [...product.compareTable.columns];
                                                                next[colIndex] = value;
                                                                updateCompareColumns(next);
                                                            }}
                                                            className="text-white"
                                                            hoverClassName="hover:bg-white/20"
                                                        />
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {product.compareTable.rows.map((row, rowIndex) => (
                                                <tr
                                                    key={`preview-row-${rowIndex}`}
                                                    className="odd:bg-white even:bg-slate-50/70"
                                                >
                                                    {product.compareTable.columns.map((_column, colIndex) => {
                                                        const cell = row[colIndex] || { value: "", href: "" };
                                                        return (
                                                            <td
                                                                key={`preview-cell-${rowIndex}-${colIndex}`}
                                                                className="px-4 py-3 border border-slate-200 text-slate-700 align-top"
                                                            >
                                                                <InlineEditableText
                                                                    value={cell.value}
                                                                    placeholder="Value"
                                                                    onCommit={(value) =>
                                                                        updateCompareCell(rowIndex, colIndex, { value })
                                                                    }
                                                                />
                                                                {cell.href && (
                                                                    <div className="text-xs text-slate-400 mt-1">
                                                                        <InlineEditableText
                                                                            value={cell.href}
                                                                            placeholder="Link"
                                                                            onCommit={(href) =>
                                                                                updateCompareCell(rowIndex, colIndex, { href })
                                                                            }
                                                                            className="text-slate-400"
                                                                        />
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <label className="grid gap-1.5 text-sm text-slate-700">
                                    <span className="font-semibold">Heading</span>
                                    <input
                                        className="rounded-xl border border-slate-200 px-4 py-2.5"
                                        value={product.compareTable.heading}
                                        onChange={(event) =>
                                            updateCompareTable({ heading: event.target.value })
                                        }
                                    />
                                </label>
                                <label className="grid gap-1.5 text-sm text-slate-700">
                                    <span className="font-semibold">Subheading</span>
                                    <input
                                        className="rounded-xl border border-slate-200 px-4 py-2.5"
                                        value={product.compareTable.subheading || ""}
                                        onChange={(event) =>
                                            updateCompareTable({ subheading: event.target.value })
                                        }
                                    />
                                </label>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-700">Columns</h3>
                                    <button
                                        onClick={addCompareColumn}
                                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold"
                                    >
                                        + Add Column
                                    </button>
                                </div>
                                <div className="mt-3 grid gap-2 md:grid-cols-2">
                                    {product.compareTable.columns.map((column, colIndex) => (
                                        <div key={`column-${colIndex}`} className="flex items-center gap-2">
                                            <input
                                                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                                                value={column}
                                                onChange={(event) => {
                                                    const next = [...product.compareTable.columns];
                                                    next[colIndex] = event.target.value;
                                                    updateCompareColumns(next);
                                                }}
                                            />
                                            <button
                                                onClick={() => removeCompareColumn(colIndex)}
                                                className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                    {product.compareTable.columns.length === 0 && (
                                        <p className="text-xs text-slate-400">No columns yet.</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-4">
                                {product.compareTable.rows.map((row, rowIndex) => (
                                    <div
                                        key={`row-${rowIndex}`}
                                        className="rounded-2xl border border-slate-200 bg-white p-4"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Row {rowIndex + 1}
                                            </p>
                                            <button
                                                onClick={() => removeCompareRow(rowIndex)}
                                                className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700"
                                            >
                                                Remove Row
                                            </button>
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            {product.compareTable.columns.map((column, colIndex) => {
                                                const cell = row[colIndex] || { value: "", href: "" };
                                                return (
                                                    <div key={`${rowIndex}-${colIndex}`} className="grid gap-2">
                                                        <span className="text-xs font-semibold text-slate-500">
                                                            {column || `Column ${colIndex + 1}`}
                                                        </span>
                                                        <input
                                                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                                            value={cell.value}
                                                            onChange={(event) =>
                                                                updateCompareCell(rowIndex, colIndex, {
                                                                    value: event.target.value,
                                                                })
                                                            }
                                                            placeholder="Value"
                                                        />
                                                        <input
                                                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs"
                                                            value={cell.href || ""}
                                                            onChange={(event) =>
                                                                updateCompareCell(rowIndex, colIndex, {
                                                                    href: event.target.value,
                                                                })
                                                            }
                                                            placeholder="Link (optional)"
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                                {product.compareTable.rows.length === 0 && (
                                    <p className="text-sm text-slate-500">No rows yet.</p>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">

                    {/* Status */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Status</h2>
                        <select
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
                            value={product.status}
                            onChange={e => updateProduct({ status: e.target.value })}
                        >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                    </div>

                    {/* Pricing */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Pricing</h2>
                        <div className="space-y-4">
                            <label className="block text-sm">
                                <span className="text-slate-700 font-medium">Device Price</span>
                                <input type="number" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2" value={product.price.device} onChange={e => updateProduct({ price: { ...product.price, device: Number(e.target.value) } })} />
                            </label>
                            <label className="block text-sm">
                                <span className="text-slate-700 font-medium">Installation</span>
                                <input type="number" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2" value={product.price.installation} onChange={e => updateProduct({ price: { ...product.price, installation: Number(e.target.value) } })} />
                            </label>
                            <div className="pt-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-3xl">
                                <span className="font-semibold text-slate-700">Total</span>
                                <span className="font-bold text-lg text-emerald-600">฿{product.price.total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Specs</h2>
                        <div className="space-y-2 mb-4">
                            {Object.entries(product.features).map(([k, v]) => (
                                <div key={k} className="flex justify-between text-sm p-2 bg-slate-50 rounded-lg group">
                                    <span className="font-medium text-slate-600">{k}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-800">{getLabel(v)}</span>
                                        <button onClick={() => removeFeature(k)} className="text-slate-400 hover:text-rose-500">×</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="grid gap-2">
                            <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" placeholder="Spec Name (e.g. Dimensions)" value={newFeatureKey} onChange={e => setNewFeatureKey(e.target.value)} />
                            <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" placeholder="Value (e.g. 50cm)" value={newFeatureValue} onChange={e => setNewFeatureValue(e.target.value)} />
                            <button onClick={addFeature} className="w-full rounded-lg bg-slate-800 py-2 text-xs font-semibold text-white">Add Spec</button>
                        </div>
                    </div>

                    {/* Warranty */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Warranty</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="block text-sm">
                                <span className="text-xs text-slate-500">Device</span>
                                <input type="text" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" value={getLabel(product.warranty.device)} onChange={e => updateProduct({ warranty: { ...product.warranty, device: updateMultiLangString(product.warranty.device, e.target.value) } })} />
                            </label>
                            <label className="block text-sm">
                                <span className="text-xs text-slate-500">Compressor</span>
                                <input type="text" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" value={getLabel(product.warranty.compressor)} onChange={e => updateProduct({ warranty: { ...product.warranty, compressor: updateMultiLangString(product.warranty.compressor, e.target.value) } })} />
                            </label>
                        </div>
                    </div>

                    {/* Highlights */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Highlights</h2>
                        <div className="space-y-2 mb-4">
                            {product.highlights.map((highlight, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg group">
                                    <input
                                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                        value={getLabel(highlight)}
                                        onChange={e => updateProduct({
                                            highlights: updateMultiLangArray(product.highlights, idx, e.target.value)
                                        })}
                                    />
                                    <button
                                        onClick={() => updateProduct({
                                            highlights: product.highlights.filter((_, i) => i !== idx)
                                        })}
                                        className="text-slate-400 hover:text-rose-500"
                                    >×</button>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => updateProduct({
                                highlights: [...product.highlights, { th: "", en: "" }]
                            })}
                            className="w-full rounded-lg bg-slate-800 py-2 text-xs font-semibold text-white"
                        >
                            + Add Highlight
                        </button>
                    </div>

                    {/* What's In the Box */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">What's In the Box</h2>
                        <div className="space-y-2 mb-4">
                            {product.inBox.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg group">
                                    <input
                                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                        value={getLabel(item)}
                                        onChange={e => updateProduct({
                                            inBox: updateMultiLangArray(product.inBox, idx, e.target.value)
                                        })}
                                    />
                                    <button
                                        onClick={() => updateProduct({
                                            inBox: product.inBox.filter((_, i) => i !== idx)
                                        })}
                                        className="text-slate-400 hover:text-rose-500"
                                    >×</button>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => updateProduct({
                                inBox: [...product.inBox, { th: "", en: "" }]
                            })}
                            className="w-full rounded-lg bg-slate-800 py-2 text-xs font-semibold text-white"
                        >
                            + Add Item
                        </button>
                    </div>

                    {/* SEO */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">SEO</h2>
                        <div className="space-y-4">
                            <label className="block text-sm">
                                <span className="text-slate-700 font-medium">Meta Title</span>
                                <input
                                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
                                    value={getLabel(product.seo.title)}
                                    onChange={e => updateProduct({
                                        seo: {
                                            ...product.seo,
                                            title: updateMultiLangString(product.seo.title, e.target.value)
                                        }
                                    })}
                                />
                            </label>
                            <label className="block text-sm">
                                <span className="text-slate-700 font-medium">Meta Description</span>
                                <textarea
                                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
                                    rows={3}
                                    value={getLabel(product.seo.description)}
                                    onChange={e => updateProduct({
                                        seo: {
                                            ...product.seo,
                                            description: updateMultiLangString(product.seo.description, e.target.value)
                                        }
                                    })}
                                />
                            </label>
                        </div>
                    </div>

                </div>
            </div>
        </div>
);
}
