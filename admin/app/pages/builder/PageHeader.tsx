"use client";

type PageHeaderProps = {
  title: string;
  slug: string;
  statusMessage?: string | null;
  onOpenPreview: () => void;
  onSave: () => void;
  onDelete: () => void;
};

export function PageHeader({
  title,
  slug,
  statusMessage,
  onOpenPreview,
  onSave,
  onDelete,
}: PageHeaderProps) {
  return (
    <header className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Page Settings
          </p>
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">/{slug}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onOpenPreview}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm"
          >
            Full Preview
          </button>
          <button
            onClick={onSave}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm text-white shadow-sm"
          >
            Save
          </button>
          <button
            onClick={onDelete}
            className="rounded-full bg-rose-100 px-4 py-2 text-sm text-rose-700 shadow-sm"
          >
            Delete
          </button>
          {statusMessage && (
            <span className="self-center text-sm font-semibold text-emerald-600">
              {statusMessage}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
