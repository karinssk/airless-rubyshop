# Product Editor Multi-Language Implementation Guide

## ✅ Completed
1. Backend Product model updated with Multi-language support
2. Backend API routes updated with locale handling
3. Types file created (`admin/app/products/types.ts`)
4. Imports added to product editor page

## 📝 Step-by-Step Implementation

### Step 1: Update ProductForm Type (Line 114-131)

Change the type definition to support multi-language:

```typescript
type ProductForm = {
    id?: string;
    name: MultiLangString;  // Changed from string
    slug: string;
    code: string;
    btu: string;
    status: string;
    categoryId?: string | null;
    description: Record<string, any>;
    features: Record<string, MultiLangString>;  // Values are now multi-lang
    highlights: MultiLangString[];  // Changed from string[]
    inBox: MultiLangString[];  // Changed from string[]
    warranty: { device: MultiLangString; compressor: MultiLangString };  // Changed
    price: { device: number; installation: number; total: number };
    images: string[];
    seo: { title: MultiLangString; description: MultiLangString; image: string };  // Changed
    compareTable: CompareTable;
};
```

### Step 2: Update emptyProduct Function (Line 133-154)

```typescript
const emptyProduct = (): ProductForm => ({
    name: { th: "", en: "" },  // Multi-lang
    slug: "",
    code: "",
    btu: "",
    status: "draft",
    categoryId: null,
    description: { type: "doc", content: [{ type: "paragraph" }] },
    features: {},
    highlights: [],
    inBox: [],
    warranty: { device: { th: "", en: "" }, compressor: { th: "", en: "" } },  // Multi-lang
    price: { device: 0, installation: 0, total: 0 },
    images: [],
    seo: { title: { th: "", en: "" }, description: { th: "", en: "" }, image: "" },  // Multi-lang
    compareTable: {
        heading: "",
        subheading: "",
        columns: [],
        rows: [],
    },
});
```

### Step 3: Add Language State (After line 172)

Add state and helper functions:

```typescript
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
```

### Step 4: Add Language Tabs UI (After line 461, before "Main Column")

```typescript
{/* Language Tabs */}
<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
    <LanguageTabs
        activeLanguage={activeLanguage}
        onLanguageChange={setActiveLanguage}
    />
</div>
```

### Step 5: Update Product Name Input (Line 473-477)

```typescript
<input
    className="rounded-xl border border-slate-200 px-4 py-2.5"
    value={getLabel(product.name)}
    onChange={e => updateProduct({
        name: updateMultiLangString(product.name, e.target.value),
        slug: isNew ? slugify(e.target.value) : product.slug
    })}
/>
```

### Step 6: Update Features (Line 833-847)

Display:
```typescript
{Object.entries(product.features).map(([k, v]) => (
    <div key={k} className="flex justify-between text-sm p-2 bg-slate-50 rounded-lg group">
        <span className="font-medium text-slate-600">{k}</span>
        <div className="flex items-center gap-2">
            <span className="text-slate-800">{getLabel(v)}</span>
            <button onClick={() => removeFeature(k)} className="text-slate-400 hover:text-rose-500">×</button>
        </div>
    </div>
))}
```

Add feature function:
```typescript
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
```

### Step 7: Update Warranty Inputs (Line 854-861)

```typescript
<input
    type="text"
    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
    value={getLabel(product.warranty.device)}
    onChange={e => updateProduct({
        warranty: {
            ...product.warranty,
            device: updateMultiLangString(product.warranty.device, e.target.value)
        }
    })}
/>

<input
    type="text"
    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
    value={getLabel(product.warranty.compressor)}
    onChange={e => updateProduct({
        warranty: {
            ...product.warranty,
            compressor: updateMultiLangString(product.warranty.compressor, e.target.value)
        }
    })}
/>
```

### Step 8: Add Highlights Section (Add after Warranty, around line 863)

```typescript
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
```

### Step 9: Add In Box Section (Add after Highlights)

```typescript
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
```

### Step 10: Add SEO Section (Add after In Box)

```typescript
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
```

### Step 11: Handle TipTap Description (Special Case)

The description editor needs to store separate content for each language. This requires:

1. Change description type to: `description: { th: any; en: any }`
2. Create separate editor instances or switch content when language changes
3. Update emptyProduct to have: `description: { th: { type: "doc", content: [{ type: "paragraph" }] }, en: { type: "doc", content: [{ type: "paragraph" }] } }`

For now, you can keep description as a single editor (not language-specific) if it's too complex.

## Testing

1. Visit `/products/new` or edit an existing product
2. Switch between Thai/English tabs
3. Enter different text for each language
4. Save and verify in database
5. Check frontend displays correct language

## Summary

**Fields with multi-language support:**
- ✅ Name
- ✅ Features (values)
- ✅ Highlights
- ✅ Warranty (device & compressor)
- ✅ In Box items
- ✅ SEO (title & description)
- ⚠️ Description (TipTap - complex, can be single language for now)

**Fields that stay single language:**
- Slug
- Code
- BTU
- Category
- Price
- Images
- Status
