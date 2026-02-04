export type MultiLangString = string | { th: string; en: string };

export type Language = "th" | "en";

// Helper function to extract language-specific string
export function getLangString(value: MultiLangString | undefined, lang: Language): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[lang] || value.th || "";
}
