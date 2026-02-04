"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type ResourceInfo = {
  name: string;
  size: number;
  duration: number;
  type: string;
};

type PerformanceData = {
  loadTime: number;
  score: number;
  scoreLabel: string;
  resources: ResourceInfo[];
  startTime: string;
  endTime: string;
};

function calculateScore(loadTime: number): { score: number; label: string } {
  if (loadTime <= 300) return { score: 10, label: "Excellent" };
  if (loadTime <= 500) return { score: 10, label: "Excellent" };
  if (loadTime <= 700) return { score: 9, label: "Very Good" };
  if (loadTime <= 900) return { score: 9, label: "Very Good" };
  if (loadTime <= 1200) return { score: 8, label: "Good" };
  if (loadTime <= 1500) return { score: 7, label: "Good" };
  if (loadTime <= 2000) return { score: 6, label: "Fair" };
  if (loadTime <= 2500) return { score: 6, label: "Fair" };
  if (loadTime <= 3000) return { score: 5, label: "Slow" };
  return { score: 5, label: "Very Slow" };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getScoreColor(score: number): string {
  if (score >= 9) return "#22c55e"; // green
  if (score >= 7) return "#84cc16"; // lime
  if (score >= 6) return "#eab308"; // yellow
  return "#ef4444"; // red
}

export default function PerformanceTracker() {
  const [isOpen, setIsOpen] = useState(false);
  const [perfData, setPerfData] = useState<PerformanceData | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const measurePerformance = () => {
      const startTime = new Date();

      // Wait for page to fully load
      if (document.readyState === "complete") {
        collectMetrics(startTime);
      } else {
        window.addEventListener("load", () => collectMetrics(startTime));
      }
    };

    const collectMetrics = (startTime: Date) => {
      setTimeout(() => {
        const endTime = new Date();
        const performance = window.performance;

        if (!performance) return;

        // Get navigation timing
        const navTiming = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
        const loadTime = navTiming ? Math.round(navTiming.loadEventEnd - navTiming.startTime) : 0;

        // Get resource timing
        const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
        const resourceInfo: ResourceInfo[] = resources
          .map((r) => ({
            name: r.name.split("/").pop() || r.name,
            fullUrl: r.name,
            size: r.transferSize || 0,
            duration: Math.round(r.duration),
            type: getResourceType(r.initiatorType, r.name),
          }))
          .filter((r) => r.size > 0)
          .sort((a, b) => b.size - a.size)
          .slice(0, 15); // Top 15 largest resources

        const { score, label } = calculateScore(loadTime);

        setPerfData({
          loadTime,
          score,
          scoreLabel: label,
          resources: resourceInfo,
          startTime: startTime.toLocaleTimeString(),
          endTime: endTime.toLocaleTimeString(),
        });
      }, 100);
    };

    const getResourceType = (initiatorType: string, name: string): string => {
      if (name.includes(".js")) return "JS";
      if (name.includes(".css")) return "CSS";
      if (name.includes(".woff") || name.includes(".ttf")) return "Font";
      if (name.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)/i)) return "Image";
      if (initiatorType === "fetch" || initiatorType === "xmlhttprequest") return "API";
      return initiatorType.toUpperCase();
    };

    // Reset and measure on route change
    setPerfData(null);
    measurePerformance();

    return () => {
      window.removeEventListener("load", () => {});
    };
  }, [pathname]);

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Button */}
      <div
        className="fixed bottom-4 right-4 z-[9999]"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        {!isOpen && perfData && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-white shadow-lg transition-all hover:scale-105"
            style={{ backgroundColor: getScoreColor(perfData.score) }}
          >
            <span className="text-lg font-bold">{perfData.score}/10</span>
            <span className="text-xs opacity-90">{perfData.loadTime}ms</span>
          </button>
        )}

        {/* Performance Panel */}
        {isOpen && perfData && (
          <div className="w-[380px] rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div
              className="flex items-center justify-between rounded-t-2xl px-4 py-3 text-white"
              style={{ backgroundColor: getScoreColor(perfData.score) }}
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold">{perfData.score}/10</div>
                <div>
                  <div className="text-sm font-semibold">{perfData.scoreLabel}</div>
                  <div className="text-xs opacity-90">{perfData.loadTime}ms load time</div>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setIsVisible(false)}
                  className="rounded-lg bg-white/20 px-2 py-1 text-xs hover:bg-white/30"
                  title="Hide tracker"
                >
                  Hide
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg bg-white/20 px-2 py-1 text-xs hover:bg-white/30"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Timing Info */}
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Start Time:</span>
                  <span className="ml-2 font-mono font-semibold text-slate-700">
                    {perfData.startTime}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">End Time:</span>
                  <span className="ml-2 font-mono font-semibold text-slate-700">
                    {perfData.endTime}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Page: <span className="font-mono text-slate-700">{pathname}</span>
              </div>
            </div>

            {/* Score Guide */}
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="mb-2 text-xs font-semibold text-slate-600">Score Guide</div>
              <div className="flex gap-1 text-[10px]">
                <span className="rounded bg-[#22c55e] px-2 py-0.5 text-white">300-900ms: 9-10</span>
                <span className="rounded bg-[#84cc16] px-2 py-0.5 text-white">900-1500ms: 7-8</span>
                <span className="rounded bg-[#eab308] px-2 py-0.5 text-white">1500-3000ms: 5-6</span>
                <span className="rounded bg-[#ef4444] px-2 py-0.5 text-white">&gt;3000ms: 5</span>
              </div>
            </div>

            {/* Resources */}
            <div className="max-h-[300px] overflow-y-auto px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  Largest Resources ({perfData.resources.length})
                </span>
                <span className="text-[10px] text-slate-400">
                  Total: {formatBytes(perfData.resources.reduce((acc, r) => acc + r.size, 0))}
                </span>
              </div>
              <div className="grid gap-1">
                {perfData.resources.map((resource, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs"
                  >
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        resource.type === "JS"
                          ? "bg-yellow-100 text-yellow-700"
                          : resource.type === "CSS"
                          ? "bg-red-100 text-red-700"
                          : resource.type === "Image"
                          ? "bg-green-100 text-green-700"
                          : resource.type === "Font"
                          ? "bg-purple-100 text-purple-700"
                          : resource.type === "API"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {resource.type}
                    </span>
                    <span className="flex-1 truncate text-slate-600" title={resource.name}>
                      {resource.name}
                    </span>
                    <span className="font-mono text-slate-500">{resource.duration}ms</span>
                    <span
                      className={`font-mono font-semibold ${
                        resource.size > 500000
                          ? "text-red-600"
                          : resource.size > 100000
                          ? "text-orange-600"
                          : "text-slate-700"
                      }`}
                    >
                      {formatBytes(resource.size)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="rounded-b-2xl border-t border-slate-100 bg-slate-50 px-4 py-2 text-center text-[10px] text-slate-400">
              Performance Tracker • Click score button to reopen after closing
            </div>
          </div>
        )}
      </div>
    </>
  );
}
