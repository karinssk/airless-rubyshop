# Multi-Language Menu Implementation

## Current Status

### ✅ Completed:
1. **Backend Model** - Supports both string and `{th: "...", en: "..."}` format
2. **Backend API** - Returns locale-specific data to frontend, full data to admin
3. **Frontend** - Displays menu in correct language based on URL
4. **Admin Fetch** - Gets full multi-language data with `?admin=1`

### 🔄 In Progress:
**Admin UI** - The menu editor at `http://localhost:4021/menu` needs language tabs

## Quick Implementation Steps

To add language tabs to the menu editor, you need to:

1. **Add Language State** (Already done - line 438)
   ```typescript
   const [activeLanguage, setActiveLanguage] = useState<Language>("th");
   ```

2. **Add Language Tabs UI** (Need to add after line 686)
   ```tsx
   <LanguageTabs
     activeLanguage={activeLanguage}
     onLanguageChange={setActiveLanguage}
   />
   ```

3. **Create Label Handlers** - Helper functions to extract/update labels:
   ```typescript
   const getLabel = (label: MultiLangString) =>
     getLangString(label, activeLanguage);

   const updateLabel = (currentLabel: MultiLangString, newValue: string) => {
     if (typeof currentLabel === "string") {
       return { th: activeLanguage === "th" ? newValue : currentLabel, en: activeLanguage === "en" ? newValue : "" };
     }
     return { ...currentLabel, [activeLanguage]: newValue };
   };
   ```

4. **Update All Label Inputs** - Wrap label values:
   ```tsx
   // Before:
   value={item.label}
   onChange={(e) => onChange({ label: e.target.value })}

   // After:
   value={getLabel(item.label)}
   onChange={(e) => onChange({ label: updateLabel(item.label, e.target.value) })}
   ```

## Locations to Update

1. **SortableItem** (line 72, 108, 151) - Main menu items
2. **NavbarPreview** (line 332, 342, 360, 370) - Preview labels
3. **Contact Bar Items** (line 796, 808) - Contact text
4. **CTA Button** (line 836, 847) - Button label

## Alternative: Simplified Approach

For now, the menu works as-is:
- **Can save multi-language data** if you manually edit the database
- **Backend returns correct language** to frontend
- **Admin shows current data** (but can't edit different languages separately yet)

To manually add multi-language menu items:
1. Go to MongoDB
2. Update menu labels from `"Home"` to `{ th: "หน้าแรก", en: "Home" }`
3. Frontend will automatically show correct language
