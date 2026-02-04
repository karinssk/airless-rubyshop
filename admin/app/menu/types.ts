export type MultiLangString = string | { th: string; en: string };

export type MenuItem = {
  id: string;
  label: MultiLangString;
  href: string;
  children?: MenuItem[];
  hasSubMenu?: boolean;
};

export type ContactBarItem = {
  id: string;
  icon: string;
  text: MultiLangString;
  link?: string;
};

export type MenuData = {
  name: string;
  items: MenuItem[];
  logoUrl?: string;
  cta?: {
    label: MultiLangString;
    href: string;
  };
  contactBar?: {
    enabled: boolean;
    backgroundColor?: string;
    textColor?: string;
    items: ContactBarItem[];
  };
};

export type Language = "th" | "en";

// Helper function to extract language-specific string
export function getLangString(value: MultiLangString | undefined, lang: Language): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[lang] || value.th || "";
}
