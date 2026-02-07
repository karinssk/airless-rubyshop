# How to Create a New Page Block

This guide explains how to add a new block type to the page builder system.

## Overview

Each block requires changes in **4 files**:

| File | Purpose |
|------|---------|
| `builder/config.ts` | Register block type, thumbnail, and default props |
| `builder/previews.tsx` | Admin live preview (drag/drop, inline editing) |
| `builder/editors.tsx` | Admin sidebar editor (form inputs) |
| `frontend/app/components/PageRenderer.tsx` | Public-facing frontend render |

---

## Step 1: Register the Block in `config.ts`

### 1A. Add to `blockCatalog` array

```ts
{
  type: "my-new-block",          // unique kebab-case identifier
  label: "My New Block",         // display name in the block picker
  preview: "bg-[var(--brand-yellow)]",  // background color of catalog card
  stripe: "bg-[var(--brand-navy)]",     // stripe accent color
},
```

### 1B. Add to `thumbnailMap`

```ts
"my-new-block": "/thumbnails/my-new-block.svg",
```

> You can reuse an existing thumbnail SVG from `/public/thumbnails/` or create a new one.

### 1C. Add to `defaultProps`

Define the initial props that a newly created block will have:

```ts
"my-new-block": {
  backgroundColor: "#ffffff",
  heading: "Default Heading",
  description: "Default description text",
  image: "",  // empty = no image, or use a placeholder URL
  items: [    // for blocks with repeatable items
    {
      title: "Item 1",
      description: "Description",
      icon: "https://cdn.jsdelivr.net/npm/heroicons@2.1.5/24/outline/star.svg",
    },
  ],
},
```

---

## Step 2: Add Admin Preview in `previews.tsx`

Inside the `renderBlock` function, add a new `if` block. The preview supports:

- **`resolvePreviewImage(value)`** — resolves upload paths to full URLs
- **`safeText(value)`** — safely converts any value to string
- **`EditableText`** — inline editable text (click to edit in preview)
- **`wrap(jsx)`** — wraps the section with drag/delete controls

### Simple block (text + image)

```tsx
if (block.type === "my-new-block") {
  const backgroundColor = safeText(props.backgroundColor) || "#ffffff";
  const image = resolvePreviewImage(props.image);
  return wrap(
    <section className="py-16" style={{ backgroundColor }}>
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
          <EditableText
            value={safeText(props.heading)}
            onCommit={(value) => onUpdateBlock(index, { heading: value })}
            className="text-[var(--brand-navy)]"
          />
        </h2>
        <p className="mt-4 text-sm text-slate-600">
          <EditableText
            value={safeText(props.description)}
            onCommit={(value) => onUpdateBlock(index, { description: value })}
            className="text-slate-600"
            multiline
          />
        </p>
        {image && (
          <img
            src={image}
            alt={safeText(props.heading)}
            className="mt-8 h-64 w-full rounded-2xl object-cover"
          />
        )}
      </div>
    </section>
  );
}
```

### Block with repeatable items

```tsx
if (block.type === "my-new-block") {
  const items = (props.items || []) as Array<Record<string, string>>;
  const backgroundColor = safeText(props.backgroundColor) || "#ffffff";
  return wrap(
    <section className="py-12" style={{ backgroundColor }}>
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-semibold">
          <EditableText
            value={safeText(props.heading)}
            onCommit={(value) => onUpdateBlock(index, { heading: value })}
          />
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {items.map((item, itemIndex) => (
            <div key={itemIndex} className="rounded-2xl bg-white p-6 shadow">
              {item.icon && (
                <img
                  src={resolvePreviewImage(item.icon)}
                  alt=""
                  className="h-8 w-8"
                />
              )}
              <h3 className="mt-4 font-semibold">
                <EditableText
                  value={safeText(item.title)}
                  onCommit={(value) =>
                    updateItem("items", itemIndex, { title: value })
                  }
                />
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                <EditableText
                  value={safeText(item.description)}
                  onCommit={(value) =>
                    updateItem("items", itemIndex, { description: value })
                  }
                  multiline
                />
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## Step 3: Add Sidebar Editor in `editors.tsx`

Inside the editor function, add a new `if` block with form controls:

```tsx
if (block.type === "my-new-block") {
  return (
    <div className="mt-3 grid gap-3 text-xs text-slate-600">
      {/* Color picker */}
      <label className="grid gap-1">
        Background Color
        <input
          type="color"
          className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-2"
          defaultValue={toLine(props.backgroundColor as string) || "#ffffff"}
          onChange={(e) =>
            updateBlockProps(index, { backgroundColor: e.target.value })
          }
        />
      </label>

      {/* Text input */}
      <label className="grid gap-1">
        Heading
        <input
          className="rounded-xl border border-slate-200 px-3 py-2"
          defaultValue={toLine(props.heading as string)}
          onBlur={(e) =>
            updateBlockProps(index, { heading: e.target.value })
          }
        />
      </label>

      {/* Image URL input */}
      <label className="grid gap-1">
        Image URL
        <input
          className="rounded-xl border border-slate-200 px-3 py-2"
          defaultValue={toLine(props.image as string)}
          onBlur={(e) =>
            updateBlockProps(index, { image: e.target.value })
          }
        />
      </label>

      {/* Image upload */}
      <label className="grid gap-1">
        Upload Image
        <input
          type="file"
          accept="image/*"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file || !uploadImage) return;
            const path = await uploadImage(file);
            updateBlockProps(index, { image: path });
          }}
        />
      </label>

      {/* Textarea (multiline) */}
      <label className="grid gap-1">
        Description
        <textarea
          className="rounded-xl border border-slate-200 px-3 py-2"
          rows={4}
          defaultValue={toLine(props.description as string)}
          onBlur={(e) =>
            updateBlockProps(index, { description: e.target.value })
          }
        />
      </label>
    </div>
  );
}
```

### Key editor functions available

| Function | Usage |
|----------|-------|
| `updateBlockProps(index, { key: value })` | Update a top-level prop |
| `uploadImage(file)` | Upload image, returns `/uploads/filename.webp` path |
| `toLine(value)` | Safely convert value to string for form defaults |

---

## Step 4: Add Frontend Renderer in `PageRenderer.tsx`

### 4A. Add the component function

```tsx
function MyNewBlock(props: Record<string, any>) {
  const backgroundStyle = safeList(props.backgroundColor)
    ? { backgroundColor: safeList(props.backgroundColor) }
    : undefined;
  return (
    <section className="py-16" style={backgroundStyle}>
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
          {safeList(props.heading)}
        </h2>
        <p className="mt-4 text-sm text-slate-600 whitespace-pre-line">
          {safeList(props.description)}
        </p>
        {props.image && (
          <img
            src={resolveImage(props.image)}
            alt={safeList(props.heading)}
            className="mt-8 h-64 w-full rounded-2xl object-cover"
          />
        )}
      </div>
    </section>
  );
}
```

### 4B. Add the case in the switch statement

In the `PageRenderer` component's block mapping:

```tsx
case "my-new-block":
  return <MyNewBlock key={index} {...block.props} />;
```

### Key frontend helpers

| Function | Usage |
|----------|-------|
| `resolveImage(value)` | Same as `resolveUploadUrl(safeList(value))` — resolves image paths |
| `safeList(value)` | Safely convert any value to string |

---

## Helper Reference

### Images

- **Admin preview**: Use `resolvePreviewImage(value)` for `src=`
- **Frontend**: Use `resolveImage(value)` for `src=`
- **Editor**: Use `uploadImage(file)` to upload, returns path like `/uploads/filename.webp`
- Image paths stored in DB are always relative: `/uploads/filename.webp`
- `resolveUploadUrl()` prepends the backend base URL at render time

### Text

- **Admin preview**: Use `safeText(value)` — converts to string
- **Frontend**: Use `safeList(value)` — same purpose, different name
- **Editor**: Use `toLine(value)` — for form default values

### Inline Editing (admin preview only)

```tsx
<EditableText
  value={safeText(props.myField)}
  onCommit={(value) => onUpdateBlock(index, { myField: value })}
  className="text-slate-600"
  multiline          // optional: enables multiline editing
/>
```

---

## Block Type Naming Convention

- Use **kebab-case**: `my-new-block` (not `myNewBlock`)
- Be descriptive: `our-core-services`, `wellness-facilities`, `contact-channels`
- Use prefixes for grouping: `hero-*`, `about-us-*`, `contact-*`

---

## Existing Block Types Reference

| Type | Description |
|------|-------------|
| `hero` | Main hero with background image, title, CTA buttons |
| `hero-images` | Hero with image slider |
| `hero-with-available-rooms-check` | Hero with search overlay |
| `hero-images-with-button` | Full-width hero image with button |
| `contact-and-services` | Phone/Line/Facebook contact strip + CTA |
| `achievement-expreience` | Stats/counters with icons |
| `about-us-text` | Text-only about section |
| `about-us-images` | Text + image about section |
| `branches-detail` | Branch locations with maps |
| `our-vision` | Vision & mission cards |
| `our-core-values` | Values grid with icons |
| `why-choose-us` | Feature cards with icons |
| `why-choose-us-v2` | Checklist style features |
| `our-core-services` | Service cards with images + icons |
| `service-process` | Numbered step timeline |
| `ready-for-service` | CTA section with two buttons |
| `our-portfolio` | Portfolio image grid with overlays |
| `our-work` | Work showcase cards |
| `our-work-gallery` | Image gallery grid |
| `grand-events` | Events showcase with multi-image layout |
| `wellness-facilities` | Alternating text/image rows |
| `images-slider` | Image carousel/slider |
| `services` | Service list (text only) |
| `our-services-v2` | Services with images |
| `products-section-images` | Product cards with images |
| `features` | Simple text feature list |
| `gallery` | Image gallery with captions |
| `faq` | Accordion FAQ |
| `frequently-asked-questions` | Styled FAQ with expand/collapse |
| `contact` | Contact CTA with phone |
| `request-quotation-forms` | Quote request form |
| `contact-channels` | Contact info grid |
| `contact-us-text` | Contact text with gradient |
| `work-with-us` | Careers header |
| `welfare-and-benefits` | Benefits grid |
| `job-vacancies` | Job listings |
| `top-products-sales` | Dynamic product grid (from DB) |
| `featured-categories` | Dynamic category grid (from DB) |

---

## File Locations

```
admin/app/pages/builder/
├── config.ts          ← block catalog + default props
├── types.ts           ← Block, PageDraft types
├── previews.tsx       ← admin live preview
├── editors.tsx        ← admin sidebar editor
├── utils.ts           ← safeText, toLine, formatItems, parseItems
├── usePages.ts        ← page CRUD + data loading
├── PageEditorPane.tsx ← editor layout wrapper
├── PagesSidebar.tsx   ← page list sidebar
└── LanguageTabs.tsx   ← th/en language switcher

frontend/app/components/
└── PageRenderer.tsx   ← public frontend renderer

admin/lib/
└── urls.ts            ← resolveUploadUrl, backendBaseUrl

frontend/lib/
└── urls.ts            ← resolveUploadUrl, backendBaseUrl
```
