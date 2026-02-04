"use client";

import { useState } from "react";

type ExpandableContentProps = {
  children: React.ReactNode;
  previewLines?: number;
};

export default function ExpandableContent({
  children,
  previewLines = 5,
}: ExpandableContentProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <div
        style={
          expanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitLineClamp: previewLines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
        }
      >
        {children}
      </div>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="mt-3 text-xs font-semibold text-[var(--brand-blue)]"
      >
        {expanded ? "ซ่อนรายละเอียด" : "ดูรายละเอียดเพิ่มเติม"}
      </button>
    </div>
  );
}
