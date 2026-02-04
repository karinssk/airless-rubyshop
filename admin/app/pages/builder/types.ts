export type Block = {
  uid: string;
  type: string;
  props: Record<string, unknown>;
};

// Multi-language support: can be string (legacy) or language object
export type MultiLangString = string | { th: string; en: string };

export type PageDraft = {
  id?: string;
  title: MultiLangString;
  slug: string;
  status: string;
  seo: {
    title?: MultiLangString;
    description?: MultiLangString;
    image?: string;
  };
  theme: {
    background?: string;
  };
  // Layout can be array (legacy) or language-specific object
  layout: Block[] | { th: Block[]; en: Block[] };
};

export type PageSummary = {
  id: string;
  title: string; // Always string in summary (backend returns th version)
  slug: string;
  status: string;
  updatedAt?: string;
};
