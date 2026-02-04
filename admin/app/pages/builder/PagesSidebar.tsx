"use client";

import type { PageSummary } from "./types";

type PagesSidebarProps = {
  pages: PageSummary[];
  activePageId?: string;
  onSelectPage: (page: PageSummary) => void;
  onCreatePage: () => void;
};

export function PagesSidebar({
  pages,
  activePageId,
  onSelectPage,
  onCreatePage,
}: PagesSidebarProps) {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Pages</h2>
        <button
          onClick={onCreatePage}
          className="rounded-full bg-blue-600 px-3 py-1 text-xs text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          New
        </button>
      </div>
      
      {pages.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-8">No pages yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Title
                </th>
                <th className="text-left py-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Slug
                </th>
                <th className="text-center py-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr
                  key={page.id}
                  onClick={() => onSelectPage(page)}
                  className={`border-b border-slate-100 cursor-pointer transition-colors ${
                    activePageId === page.id
                      ? "bg-blue-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <td className="py-3 px-2">
                    <p className={`font-semibold ${
                      activePageId === page.id ? "text-blue-700" : "text-slate-700"
                    }`}>
                      {page.title}
                    </p>
                  </td>
                  <td className="py-3 px-2">
                    <p className="text-xs text-slate-500">/{page.slug}</p>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      page.status === "published"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {page.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </aside>
  );
}
