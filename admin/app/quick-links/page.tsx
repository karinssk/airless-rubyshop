"use client";

import { useEffect, useState } from "react";
import { backendBaseUrl } from "@/lib/urls";

type LinkConfig = {
  enabled: boolean;
  href: string;
  label?: string;
};

type QuickLinksData = {
  whatsapp: LinkConfig;
  line: LinkConfig;
  phone: LinkConfig;
};

const emptyLinks: QuickLinksData = {
  whatsapp: { enabled: true, href: "" },
  line: { enabled: true, href: "" },
  phone: { enabled: true, href: "", label: "" },
};

export default function QuickLinksPage() {
  const [links, setLinks] = useState<QuickLinksData>(emptyLinks);
  const [message, setMessage] = useState<string | null>(null);

  const loadLinks = async () => {
    const response = await fetch(`${backendBaseUrl}/quick-links`);
    const data = await response.json();
    if (data.links) {
      setLinks({
        whatsapp: data.links.whatsapp || emptyLinks.whatsapp,
        line: data.links.line || emptyLinks.line,
        phone: data.links.phone || emptyLinks.phone,
      });
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  const updateLinks = (key: keyof QuickLinksData, patch: Partial<LinkConfig>) => {
    setLinks((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
  };

  const saveLinks = async () => {
    const response = await fetch(`${backendBaseUrl}/quick-links`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(links),
    });
    if (response.ok) {
      setMessage("Saved");
      setTimeout(() => setMessage(null), 1200);
    }
  };

  return (
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              Quick Contact Links
            </h2>
            <p className="text-xs text-slate-400">
              ตั้งค่าปุ่มลัด WhatsApp, LINE OA, โทรศัพท์
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={saveLinks}
              className="rounded-full bg-emerald-600 px-4 py-2 text-xs text-white"
            >
              Save
            </button>
            {message && (
              <span className="text-xs text-emerald-600">{message}</span>
            )}
          </div>
        </header>

        <div className="mt-6 grid gap-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">WhatsApp</h3>
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={links.whatsapp.enabled}
                  onChange={(event) =>
                    updateLinks("whatsapp", { enabled: event.target.checked })
                  }
                />
                Enable
              </label>
            </div>
            <input
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="https://wa.me/66922934488"
              value={links.whatsapp.href}
              onChange={(event) =>
                updateLinks("whatsapp", { href: event.target.value })
              }
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">LINE OA</h3>
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={links.line.enabled}
                  onChange={(event) =>
                    updateLinks("line", { enabled: event.target.checked })
                  }
                />
                Enable
              </label>
            </div>
            <input
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="https://line.me"
              value={links.line.href}
              onChange={(event) =>
                updateLinks("line", { href: event.target.value })
              }
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Phone</h3>
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={links.phone.enabled}
                  onChange={(event) =>
                    updateLinks("phone", { enabled: event.target.checked })
                  }
                />
                Enable
              </label>
            </div>
            <input
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="tel:092-293-4488"
              value={links.phone.href}
              onChange={(event) =>
                updateLinks("phone", { href: event.target.value })
              }
            />
            <input
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="Label (optional)"
              value={links.phone.label || ""}
              onChange={(event) =>
                updateLinks("phone", { label: event.target.value })
              }
            />
          </div>
        </div>
      </div>
  );
}
