import { useMemo } from "react";
import type { MenuItem, ContactBarItem, MenuData, MultiLangString, Language } from "./types";
import { getLangString } from "./types";

export function useMenuLanguage(menu: MenuData | null, activeLanguage: Language) {
  // Helper to update a multi-language string
  const updateMultiLangString = (
    currentValue: MultiLangString | undefined,
    newValue: string,
    lang: Language
  ): MultiLangString => {
    if (!currentValue || typeof currentValue === "string") {
      // Convert from string to multi-lang
      return {
        th: lang === "th" ? newValue : (currentValue as string) || "",
        en: lang === "en" ? newValue : "",
      };
    }
    // Update existing multi-lang
    return { ...currentValue, [lang]: newValue };
  };

  // Extract localized menu for display/editing
  const localizedMenu = useMemo(() => {
    if (!menu) return null;

    const localizeMenuItem = (item: MenuItem): MenuItem & { _originalLabel: MultiLangString } => ({
      ...item,
      label: getLangString(item.label, activeLanguage),
      _originalLabel: item.label,
      children: item.children?.map(localizeMenuItem),
    });

    return {
      ...menu,
      items: menu.items.map(localizeMenuItem),
      cta: menu.cta
        ? {
            ...menu.cta,
            label: getLangString(menu.cta.label, activeLanguage),
            _originalLabel: menu.cta.label,
          }
        : undefined,
      contactBar: menu.contactBar
        ? {
            ...menu.contactBar,
            items: menu.contactBar.items.map((item) => ({
              ...item,
              text: getLangString(item.text, activeLanguage),
              _originalText: item.text,
            })),
          }
        : undefined,
    };
  }, [menu, activeLanguage]);

  // Create update handlers that work with multi-lang
  const createLabelUpdater = (originalLabel: MultiLangString) => (newValue: string) => {
    return updateMultiLangString(originalLabel, newValue, activeLanguage);
  };

  return {
    localizedMenu,
    updateMultiLangString,
    createLabelUpdater,
    getLangString: (value: MultiLangString | undefined) => getLangString(value, activeLanguage),
  };
}

// Type for localized menu (with string labels for inputs)
export type LocalizedMenuItem = MenuItem & {
  label: string;
  _originalLabel: MultiLangString;
  children?: LocalizedMenuItem[];
};

export type LocalizedMenuData = Omit<MenuData, 'items' | 'cta' | 'contactBar'> & {
  items: LocalizedMenuItem[];
  cta?: {
    label: string;
    href: string;
    _originalLabel: MultiLangString;
  };
  contactBar?: {
    enabled: boolean;
    backgroundColor?: string;
    textColor?: string;
    items: Array<ContactBarItem & { text: string; _originalText: MultiLangString }>;
  };
};
