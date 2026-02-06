"use client";

import { useEffect, useState } from "react";
import { backendBaseUrl } from "@/lib/urls";

type QuickLinks = {
  line: { enabled: boolean; href: string };
  phone: { enabled: boolean; href: string; label?: string };
};

export default function ChatWidget() {
  const [quickLinks, setQuickLinks] = useState<QuickLinks | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchQuickLinks = async () => {
      try {
        const res = await fetch(`${backendBaseUrl}/quick-links`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.links) {
          setQuickLinks(data.links);
        }
      } catch (err) {
        console.error("Failed to fetch quick links", err);
      }
    };
    fetchQuickLinks();
  }, []);

  if (!quickLinks?.line?.enabled && !quickLinks?.phone?.enabled) return null;

  const menuClasses = [
    "flex flex-col items-center gap-3 transition-all duration-200",
    isOpen
      ? "pointer-events-auto translate-y-0 opacity-100"
      : "pointer-events-none translate-y-2 opacity-0",
    "lg:pointer-events-none lg:translate-y-2 lg:opacity-0 lg:group-hover:pointer-events-auto lg:group-hover:translate-y-0 lg:group-hover:opacity-100",
  ].join(" ");

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className="group relative flex flex-col items-center gap-3">
        <div className={menuClasses} aria-hidden={!isOpen}>
          {quickLinks?.line?.enabled && quickLinks.line.href && (
            <a
              href={quickLinks.line.href}
              target="_blank"
              rel="noreferrer"
              className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-[#06C755] text-white shadow-lg"
              aria-label="Line OA"
              onClick={() => setIsOpen(false)}
            >
              <span className="pointer-events-none absolute right-14 whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-lg opacity-0 transition lg:group-hover:opacity-100">
                LINE OA
              </span>
              <svg viewBox="0 0 36 36" width="20" height="20" fill="currentColor">
                <path d="M18 6C11.37 6 6 10.26 6 15.5c0 3.02 1.76 5.68 4.5 7.39V30l4.48-2.46c.97.2 2 .31 3.02.31 6.63 0 12-4.26 12-9.5S24.63 6 18 6zm-4.25 11c-.83 0-1.5-.67-1.5-1.5S12.92 14 13.75 14s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.25 0c-.83 0-1.5-.67-1.5-1.5S17.17 14 18 14s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.25 0c-.83 0-1.5-.67-1.5-1.5S21.42 14 22.25 14s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
              </svg>
            </a>
          )}
          {quickLinks?.phone?.enabled && quickLinks.phone.href && (
            <a
              href={quickLinks.phone.href}
              className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-blue)] text-white shadow-lg"
              aria-label="Phone"
              onClick={() => setIsOpen(false)}
            >
              <span className="pointer-events-none absolute right-14 whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-lg opacity-0 transition lg:group-hover:opacity-100">
                {quickLinks.phone.label ||
                  quickLinks.phone.href.replace(/^tel:/, "")}
              </span>
              ☎
            </a>
          )}
        </div>
        <button
          type="button"
          aria-label="Chat options"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-navy)] text-white shadow-lg transition hover:-translate-y-0.5"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.7 8.7 0 0 1-4-.95L3 21l1.95-5.5A8.5 8.5 0 1 1 21 11.5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
