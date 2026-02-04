# Service Editor Multi-Language Implementation Guide

## ✅ Completed
1. Backend Service model updated with Multi-language support
2. Backend API routes updated with locale handling
3. Types file created (`admin/app/services/types.ts`)

## 📝 Implementation Steps for ServiceEditor.tsx

### Step 1: Add Imports (After line 15)

```typescript
import { LanguageTabs } from "../pages/builder/LanguageTabs";
import type { MultiLangString, Language } from "./types";
import { getLangString } from "./types";
```

### Step 2: Update ServiceDetail Type (Around line 35-50)

```typescript
type ServiceDetail = {
  id?: string;
  title: MultiLangString;  // Changed from string
  slug: string;
  status: string;
  categoryId: string | null;
  price: MultiLangString;  // Changed from string
  shortDescription: MultiLangString;  // Changed from string
  rating: number;
  reviewCount: number;
  coverImage: string;
  gallery: string[];
  videos: string[];
  seo: {
    title: MultiLangString;  // Changed from string
    description: MultiLangString;  // Changed from string
    image: string
  };
  content: Record<string, any>;
};
```

### Step 3: Update emptyService Function (Around line 52-66)

```typescript
const emptyService = (): ServiceDetail => ({
  title: { th: "บริการใหม่", en: "New Service" },  // Multi-lang
  slug: "new-service",
  status: "draft",
  categoryId: null,
  price: { th: "", en: "" },  // Multi-lang
  shortDescription: { th: "", en: "" },  // Multi-lang
  rating: 5,
  reviewCount: 0,
  coverImage: "",
  gallery: [],
  videos: [],
  seo: {
    title: { th: "", en: "" },  // Multi-lang
    description: { th: "", en: "" },  // Multi-lang
    image: ""
  },
  content: { type: "doc", content: [{ type: "paragraph" }] },
});
```

### Step 4: Add Language State (After line 82)

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
```

### Step 5: Add Language Tabs UI (After line 306, before form fields)

```typescript
{/* Language Tabs */}
<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
    <LanguageTabs
        activeLanguage={activeLanguage}
        onLanguageChange={setActiveLanguage}
    />
</div>
```

### Step 6: Update Title Input (Around line 315-321)

```typescript
<input
    className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus:border-blue-400 focus:outline-none"
    value={getLabel(activeService.title)}
    onChange={(event) =>
        updateService({
            title: updateMultiLangString(activeService.title, event.target.value),
            slug: !slug ? slugify(event.target.value) : activeService.slug
        })
    }
/>
```

### Step 7: Update Price Input (Find the price field)

```typescript
<input
    className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
    value={getLabel(activeService.price)}
    onChange={(event) =>
        updateService({
            price: updateMultiLangString(activeService.price, event.target.value)
        })
    }
/>
```

### Step 8: Update Short Description (Find shortDescription field)

```typescript
<textarea
    className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
    value={getLabel(activeService.shortDescription)}
    onChange={(event) =>
        updateService({
            shortDescription: updateMultiLangString(activeService.shortDescription, event.target.value)
        })
    }
/>
```

### Step 9: Update SEO Fields

```typescript
{/* SEO Title */}
<input
    className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
    value={getLabel(activeService.seo.title)}
    onChange={(event) =>
        updateService({
            seo: {
                ...activeService.seo,
                title: updateMultiLangString(activeService.seo.title, event.target.value)
            }
        })
    }
/>

{/* SEO Description */}
<textarea
    className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
    value={getLabel(activeService.seo.description)}
    onChange={(event) =>
        updateService({
            seo: {
                ...activeService.seo,
                description: updateMultiLangString(activeService.seo.description, event.target.value)
            }
        })
    }
/>
```

### Step 10: Update Display in Header (Around line 277)

```typescript
<h1 className="text-2xl font-semibold text-slate-900">
    {getLabel(activeService.title)}
</h1>
```

## Frontend Implementation

The frontend service pages need to be updated to pass locale parameter to API calls.

### Files to Update:
1. `/frontend/app/[locale]/services/page.tsx` - Add locale to fetch
2. `/frontend/app/[locale]/services/[slug]/page.tsx` - Add locale to fetch
3. Update all service links to use next-intl Link component

### Changes Required:

```typescript
// 1. Import Link from navigation
import { Link } from "@/lib/navigation";

// 2. Update fetch calls
async function fetchServices(locale: string): Promise<ServiceSummary[]> {
    const response = await fetch(
        `${backendBaseUrl}/services?status=published&locale=${locale}`,
        { cache: "no-store" }
    );
    // ...
}

async function fetchService(slug: string, locale: string): Promise<ServiceDetail | null> {
    const response = await fetch(
        `${backendBaseUrl}/services/${slug}?locale=${locale}`,
        { cache: "no-store" }
    );
    // ...
}

// 3. Update component to get locale from params
export default async function ServicesPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const services = await fetchServices(locale);
    // ...
}

// 4. Replace <a> tags with <Link> components
<Link href={`/services/${service.slug}`}>
    {/* content */}
</Link>
```

## Testing

1. Visit `/services/new` or edit an existing service
2. Switch between Thai/English tabs
3. Enter different text for each language
4. Save and verify in database
5. Check frontend displays correct language based on locale

## Summary

**Fields with multi-language support:**
- ✅ Title
- ✅ Price
- ✅ Short Description
- ✅ SEO Title
- ✅ SEO Description
- ⚠️ Content (TipTap editor - single language for now)

**Fields that stay single language:**
- Slug
- Status
- Category
- Rating
- Review Count
- Cover Image
- Gallery
- Videos
