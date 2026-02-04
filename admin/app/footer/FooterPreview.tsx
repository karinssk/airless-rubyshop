"use client";

import { resolveUploadUrl } from "@/lib/urls";

type FooterLink = {
  id?: string;
  label?: string;
  href?: string;
};

type FooterSocial = {
  id?: string;
  label?: string;
  href?: string;
  icon?: string;
};

type FooterContact = {
  id?: string;
  label?: string;
  value?: string;
  href?: string;
  icon?: string;
};

type FooterData = {
  backgroundColor?: string;
  brand?: {
    name?: string;
    description?: string;
    logoUrl?: string;
  };
  social?: FooterSocial[];
  services?: FooterLink[];
  menu?: FooterLink[];
  contact?: FooterContact[];
  copyright?: string;
  subfooter?: string;
};

const safeText = (value?: string) => (value ? String(value) : "");

type FooterPreviewProps = {
  footer: FooterData;
  onBrandChange: (key: "name" | "description", value: string) => void;
  onFooterTextChange: (key: "copyright" | "subfooter", value: string) => void;
  onListChange: (
    section: "services" | "menu",
    index: number,
    key: "label",
    value: string
  ) => void;
  onContactChange: (
    index: number,
    key: "label" | "value",
    value: string
  ) => void;
};

function EditableText({
  value,
  onCommit,
  className,
}: {
  value: string;
  onCommit: (next: string) => void;
  className?: string;
}) {
  return (
    <span
      className={`inline-block rounded-md px-1 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 ${className || ""}`}
      contentEditable
      suppressContentEditableWarning
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          (event.currentTarget as HTMLElement).blur();
        }
      }}
      onBlur={(event) => onCommit(event.currentTarget.textContent?.trim() || "")}
    >
      {value}
    </span>
  );
}

export default function FooterPreview({
  footer,
  onBrandChange,
  onFooterTextChange,
  onListChange,
  onContactChange,
}: FooterPreviewProps) {
  const backgroundStyle = safeText(footer.backgroundColor)
    ? { backgroundColor: safeText(footer.backgroundColor) }
    : undefined;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 shadow">
      <footer className="text-white" style={backgroundStyle}>
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[1.2fr_1fr_1fr_1.1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {footer.brand?.logoUrl ? (
                <img
                  src={resolveUploadUrl(safeText(footer.brand.logoUrl))}
                  alt={safeText(footer.brand?.name)}
                  className="h-10 w-10 rounded-full bg-white p-1"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-white/10" />
              )}
              <p className="text-lg font-semibold">
                <EditableText
                  value={safeText(footer.brand?.name)}
                  onCommit={(value) => onBrandChange("name", value)}
                />
              </p>
            </div>
            <p className="text-sm text-white/80">
              <EditableText
                value={safeText(footer.brand?.description)}
                onCommit={(value) => onBrandChange("description", value)}
                className="text-white/80"
              />
            </p>
            <div className="flex flex-wrap gap-3">
              {(footer.social || []).map((item) => (
                <div
                  key={item.id || item.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
                  aria-label={safeText(item.label)}
                >
                  {item.icon ? (
                    <img
                      src={resolveUploadUrl(safeText(item.icon))}
                      alt=""
                      className="h-4 w-4 brightness-0 invert"
                    />
                  ) : (
                    <span className="text-xs">•</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">Our services</p>
            <ul className="mt-4 grid gap-2 text-sm text-white/80">
              {(footer.services || []).map((item, index) => (
                <li key={item.id || item.label}>
                  <EditableText
                    value={safeText(item.label)}
                    onCommit={(value) =>
                      onListChange("services", index, "label", value)
                    }
                  />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">เมนูหลัก</p>
            <ul className="mt-4 grid gap-2 text-sm text-white/80">
              {(footer.menu || []).map((item, index) => (
                <li key={item.id || item.label}>
                  <EditableText
                    value={safeText(item.label)}
                    onCommit={(value) =>
                      onListChange("menu", index, "label", value)
                    }
                  />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">ติดต่อเรา</p>
            <ul className="mt-4 grid gap-3 text-sm text-white/80">
              {(footer.contact || []).map((item, index) => (
                <li key={item.id || item.label} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                    {item.icon ? (
                      <img
                        src={resolveUploadUrl(safeText(item.icon))}
                        alt=""
                        className="h-3.5 w-3.5 brightness-0 invert"
                      />
                    ) : (
                      <span className="text-[10px]">•</span>
                    )}
                  </span>
                  <div>
                    <span className="block">
                      <EditableText
                        value={safeText(item.label)}
                        onCommit={(value) =>
                          onContactChange(index, "label", value)
                        }
                      />
                    </span>
                    {item.value && (
                      <span className="block text-white/70">
                        <EditableText
                          value={safeText(item.value)}
                          onCommit={(value) =>
                            onContactChange(index, "value", value)
                          }
                          className="text-white/70"
                        />
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-6">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-6 text-center text-xs text-white/70">
            <p>
              <EditableText
                value={safeText(footer.copyright)}
                onCommit={(value) => onFooterTextChange("copyright", value)}
              />
            </p>
            <p>
              <EditableText
                value={safeText(footer.subfooter)}
                onCommit={(value) => onFooterTextChange("subfooter", value)}
              />
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
