"use client";

import { useEffect, useMemo, useState } from "react";
import { backendBaseUrl } from "@/lib/urls";
import { getAdminAuthHeaders } from "@/lib/auth";

type DeviceFilter = "all" | "iphone" | "android" | "pc" | "linux" | "mac";
type DateRangeFilter = "all" | "today" | "7d" | "30d" | "custom";

const deviceLabels: Record<DeviceFilter, string> = {
  all: "All",
  iphone: "iPhone",
  android: "Android",
  pc: "PC",
  linux: "Linux",
  mac: "Mac",
};

const dateRangeLabels: Record<DateRangeFilter, string> = {
  all: "All Time",
  today: "Today",
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  custom: "Custom",
};

type VisitorStats = {
  totalViews: number;
  totalVisitors: number;
};

type MessengerStats = {
  totalClicks: number;
  todayClicks: number;
  clickLogs: MessengerClickLog[];
  page: number;
  limit: number;
  totalPages: number;
  filteredTotalClicks: number;
  dailyBreakdown: DailyCount[];
  hourlyBreakdown: HourlyCount[];
  deviceBreakdown: Record<string, number>;
};

type DailyCount = {
  date: string;
  count: number;
};

type HourlyCount = {
  hour: number;
  count: number;
};

type MessengerClickLog = {
  _id: string;
  ip: string;
  userAgent: string;
  referrer: string;
  createdAt: string;
  device: string;
};

const deviceColors: Record<DeviceFilter, string> = {
  all: "#334155",
  iphone: "#2563eb",
  android: "#16a34a",
  pc: "#f59e0b",
  linux: "#8b5cf6",
  mac: "#ef4444",
};

export default function Dashboard() {
  const [stats, setStats] = useState<VisitorStats>({
    totalViews: 0,
    totalVisitors: 0,
  });
  const [messengerStats, setMessengerStats] = useState<MessengerStats>({
    totalClicks: 0,
    todayClicks: 0,
    clickLogs: [],
    page: 1,
    limit: 50,
    totalPages: 1,
    filteredTotalClicks: 0,
    dailyBreakdown: [],
    hourlyBreakdown: [],
    deviceBreakdown: { all: 0, iphone: 0, android: 0, pc: 0, linux: 0, mac: 0 },
  });
  const [logsPage, setLogsPage] = useState(1);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedLog, setSelectedLog] = useState<MessengerClickLog | null>(null);

  useEffect(() => {
    if (!backendBaseUrl) return;
    const fetchStats = async () => {
      try {
        const response = await fetch(`${backendBaseUrl}/stats/visit`);
        if (!response.ok) return;
        const data = await response.json();
        if (data?.stats) {
          setStats({
            totalViews: Number(data.stats.totalViews || 0),
            totalVisitors: Number(data.stats.totalVisitors || 0),
          });
        }
      } catch (error) {
        console.error("Failed to fetch visitor stats", error);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    if (!backendBaseUrl) return;
    const fetchMessengerStats = async () => {
      setIsLogsLoading(true);
      try {
        const query = new URLSearchParams({
          page: String(logsPage),
          limit: "50",
          device: deviceFilter,
          dateRange: dateRangeFilter,
        });
        if (dateRangeFilter === "custom") {
          if (customStartDate) query.set("startDate", customStartDate);
          if (customEndDate) query.set("endDate", customEndDate);
        }
        const response = await fetch(
          `${backendBaseUrl}/stats/messenger-clicks?${query.toString()}`,
          { headers: getAdminAuthHeaders() }
        );
        if (!response.ok) return;
        const data = await response.json();
        if (data?.ok) {
          setMessengerStats({
            totalClicks: Number(data.totalClicks || 0),
            todayClicks: Number(data.todayClicks || 0),
            clickLogs: Array.isArray(data.clickLogs) ? data.clickLogs : [],
            page: Number(data.page || 1),
            limit: Number(data.limit || 50),
            totalPages: Number(data.totalPages || 1),
            filteredTotalClicks: Number(data.filteredTotalClicks || 0),
            dailyBreakdown: Array.isArray(data.dailyBreakdown)
              ? data.dailyBreakdown
              : [],
            hourlyBreakdown: Array.isArray(data.hourlyBreakdown)
              ? data.hourlyBreakdown
              : [],
            deviceBreakdown:
              typeof data.deviceBreakdown === "object" && data.deviceBreakdown
                ? data.deviceBreakdown
                : { all: 0, iphone: 0, android: 0, pc: 0, linux: 0, mac: 0 },
          });
        }
      } catch (error) {
        console.error("Failed to fetch messenger stats", error);
      } finally {
        setIsLogsLoading(false);
      }
    };
    fetchMessengerStats();
  }, [logsPage, deviceFilter, dateRangeFilter, customStartDate, customEndDate]);

  const trendChart = useMemo(() => {
    const data = messengerStats.dailyBreakdown;
    const width = 520;
    const height = 180;
    const padding = 20;
    const maxCount = Math.max(1, ...data.map((item) => Number(item.count || 0)));

    if (data.length === 0) {
      return {
        width,
        height,
        maxCount,
        linePoints: "",
        areaPoints: "",
        firstDate: "",
        lastDate: "",
      };
    }

    const stepX = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;
    const plotted = data.map((item, index) => {
      const x = padding + index * stepX;
      const y =
        height - padding - (Number(item.count || 0) / maxCount) * (height - padding * 2);
      return { x, y };
    });

    const linePoints = plotted.map((point) => `${point.x},${point.y}`).join(" ");
    const areaPoints = `${padding},${height - padding} ${linePoints} ${
      padding + stepX * (data.length - 1)
    },${height - padding}`;

    return {
      width,
      height,
      maxCount,
      linePoints,
      areaPoints,
      firstDate: data[0]?.date || "",
      lastDate: data[data.length - 1]?.date || "",
    };
  }, [messengerStats.dailyBreakdown]);

  const deviceChart = useMemo(() => {
    const items = (Object.keys(deviceLabels) as DeviceFilter[])
      .filter((key) => key !== "all")
      .map((key) => ({
        key,
        label: deviceLabels[key],
        color: deviceColors[key],
        value: Number(messengerStats.deviceBreakdown[key] || 0),
      }));
    const total = items.reduce((sum, item) => sum + item.value, 0);
    let running = 0;
    const gradient = items
      .map((item) => {
        const start = running;
        const share = total > 0 ? (item.value / total) * 100 : 0;
        running += share;
        return `${item.color} ${start}% ${running}%`;
      })
      .join(", ");

    return {
      items,
      total,
      gradient: gradient || "#e2e8f0 0% 100%",
    };
  }, [messengerStats.deviceBreakdown]);

  const hourlyChart = useMemo(() => {
    const mapped = Array.from({ length: 24 }, (_, hour) => {
      const row = messengerStats.hourlyBreakdown.find(
        (entry) => Number(entry.hour) === hour
      );
      return { hour, count: Number(row?.count || 0) };
    });
    const maxCount = Math.max(1, ...mapped.map((item) => item.count));
    return { data: mapped, maxCount };
  }, [messengerStats.hourlyBreakdown]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back to RUBYSHOP Panel</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div>
            <p className="text-sm text-slate-500">หน้าที่เข้าชม</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {stats.totalViews.toLocaleString()} ครั้ง
            </p>
          </div>
          <span className="text-xs text-slate-400">Page Views</span>
        </div>
        <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div>
            <p className="text-sm text-slate-500">ผู้ชมทั้งหมด</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {stats.totalVisitors.toLocaleString()} ครั้ง
            </p>
          </div>
          <span className="text-xs text-slate-400">Unique Visitors</span>
        </div>
        <div className="flex items-center justify-between rounded-3xl border border-blue-100 bg-blue-50/50 px-6 py-4 shadow-sm">
          <div>
            <p className="text-sm text-blue-600">Messenger คลิก</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {messengerStats.totalClicks.toLocaleString()} ครั้ง
            </p>
          </div>
          <span className="text-xs text-blue-400">All Time</span>
        </div>
        <div className="flex items-center justify-between rounded-3xl border border-blue-100 bg-blue-50/50 px-6 py-4 shadow-sm">
          <div>
            <p className="text-sm text-blue-600">Messenger วันนี้</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {messengerStats.todayClicks.toLocaleString()} ครั้ง
            </p>
          </div>
          <span className="text-xs text-blue-400">Today</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-base font-semibold text-slate-900">Click Trend</h3>
          <p className="mt-1 text-xs text-slate-500">
            Daily clicks for the active device/date filters.
          </p>
          {trendChart.linePoints ? (
            <div className="mt-4">
              <svg
                viewBox={`0 0 ${trendChart.width} ${trendChart.height}`}
                className="h-44 w-full"
                role="img"
                aria-label="Clicks trend chart"
              >
                <polyline
                  points={trendChart.areaPoints}
                  fill="rgba(37, 99, 235, 0.15)"
                  stroke="none"
                />
                <polyline
                  points={trendChart.linePoints}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>{trendChart.firstDate || "-"}</span>
                <span>Max {trendChart.maxCount.toLocaleString()}</span>
                <span>{trendChart.lastDate || "-"}</span>
              </div>
            </div>
          ) : (
            <p className="mt-8 text-sm text-slate-500">No trend data for this filter.</p>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-base font-semibold text-slate-900">Device Share</h3>
          <p className="mt-1 text-xs text-slate-500">
            Breakdown by device for the active date filter.
          </p>
          <div className="mt-4 flex items-center gap-5">
            <div
              className="relative h-36 w-36 rounded-full"
              style={{ background: `conic-gradient(${deviceChart.gradient})` }}
            >
              <div className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-white text-center">
                <span className="text-xs text-slate-500">Total</span>
                <span className="text-sm font-semibold text-slate-900">
                  {deviceChart.total.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="grid flex-1 gap-2 text-sm">
              {deviceChart.items.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-600">{item.label}</span>
                  </div>
                  <span className="font-medium text-slate-800">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-base font-semibold text-slate-900">Hourly Activity</h3>
          <p className="mt-1 text-xs text-slate-500">
            Click distribution across 24 hours.
          </p>
          <div className="mt-4">
            <div className="flex h-40 items-end gap-1">
              {hourlyChart.data.map((item) => {
                const barHeight = Math.max(
                  2,
                  (item.count / hourlyChart.maxCount) * 100
                );
                return (
                  <div
                    key={item.hour}
                    className="group relative flex-1 rounded-t bg-emerald-400/80 hover:bg-emerald-500"
                    style={{ height: `${barHeight}%` }}
                    title={`${item.hour.toString().padStart(2, "0")}:00 - ${item.count.toLocaleString()} clicks`}
                  />
                );
              })}
            </div>
            <div className="mt-2 grid grid-cols-4 text-[11px] text-slate-500">
              <span>00:00</span>
              <span className="text-center">06:00</span>
              <span className="text-center">12:00</span>
              <span className="text-right">18:00</span>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Messenger Click Logs</h2>
            <p className="text-sm text-slate-500">
              Track who clicked (IP), when they clicked, and what device they used.
            </p>
          </div>
          <div className="text-sm text-slate-600">
            {messengerStats.filteredTotalClicks.toLocaleString()} filtered /{" "}
            {messengerStats.totalClicks.toLocaleString()} total
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-3 sm:px-6">
          {(Object.keys(deviceLabels) as DeviceFilter[]).map((device) => {
            const isActive = deviceFilter === device;
            return (
              <button
                key={device}
                type="button"
                onClick={() => {
                  setDeviceFilter(device);
                  setLogsPage(1);
                  setSelectedLog(null);
                }}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  isActive
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {deviceLabels[device]} ({Number(messengerStats.deviceBreakdown[device] || 0).toLocaleString()})
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3 sm:px-6">
          {(Object.keys(dateRangeLabels) as DateRangeFilter[]).map((range) => {
            const isActive = dateRangeFilter === range;
            return (
              <button
                key={range}
                type="button"
                onClick={() => {
                  setDateRangeFilter(range);
                  setLogsPage(1);
                  setSelectedLog(null);
                }}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  isActive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {dateRangeLabels[range]}
              </button>
            );
          })}
          {dateRangeFilter === "custom" && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(event) => {
                  setCustomStartDate(event.target.value);
                  setLogsPage(1);
                  setSelectedLog(null);
                }}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700"
              />
              <span className="text-sm text-slate-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(event) => {
                  setCustomEndDate(event.target.value);
                  setLogsPage(1);
                  setSelectedLog(null);
                }}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700"
              />
            </div>
          )}
        </div>

        <div className="border-b border-slate-100 px-5 py-2 text-sm text-slate-500 sm:px-6">
          Active filter: <span className="font-medium text-slate-700">{deviceLabels[deviceFilter]}</span>
          {" • "}
          Date: <span className="font-medium text-slate-700">{dateRangeLabels[dateRangeFilter]}</span>
          {" • "}
          Click a row to view full detail
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">#</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Device</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">IP Address</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Timestamp</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Referrer</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">User Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLogsLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Loading logs...
                  </td>
                </tr>
              ) : messengerStats.clickLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No messenger click logs found for {deviceLabels[deviceFilter]}.
                  </td>
                </tr>
              ) : (
                messengerStats.clickLogs.map((log, index) => (
                  <tr
                    key={log._id}
                    onClick={() => setSelectedLog(log)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-slate-600">
                      {(messengerStats.page - 1) * messengerStats.limit + index + 1}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{log.device || "-"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">
                      {log.ip || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-700" title={log.referrer || "-"}>
                      {log.referrer || "-"}
                    </td>
                    <td className="max-w-sm truncate px-4 py-3 text-slate-600" title={log.userAgent || "-"}>
                      {log.userAgent || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selectedLog && (
          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Click Log Detail</h3>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-2">
              <div>
                <p className="text-slate-500">Log ID</p>
                <p className="font-mono text-xs">{selectedLog._id}</p>
              </div>
              <div>
                <p className="text-slate-500">Device</p>
                <p>{selectedLog.device || "-"}</p>
              </div>
              <div>
                <p className="text-slate-500">IP Address</p>
                <p className="font-mono text-xs">{selectedLog.ip || "-"}</p>
              </div>
              <div>
                <p className="text-slate-500">Timestamp</p>
                <p>{selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : "-"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-slate-500">Referrer</p>
                <p className="break-all">{selectedLog.referrer || "-"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-slate-500">User Agent</p>
                <p className="break-all font-mono text-xs">{selectedLog.userAgent || "-"}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 sm:px-6">
          <p className="text-sm text-slate-500">
            Page {messengerStats.page} of {messengerStats.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setLogsPage((current) => Math.max(1, current - 1));
                setSelectedLog(null);
              }}
              disabled={logsPage <= 1 || isLogsLoading}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => {
                setLogsPage((current) =>
                  Math.min(messengerStats.totalPages, current + 1)
                );
                setSelectedLog(null);
              }}
              disabled={logsPage >= messengerStats.totalPages || isLogsLoading}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
