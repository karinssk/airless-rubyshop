"use client";

import { useEffect, useState } from "react";
import { backendBaseUrl } from "@/lib/urls";
import { getAdminAuthHeaders } from "@/lib/auth";

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
};

type MessengerClickLog = {
  _id: string;
  ip: string;
  userAgent: string;
  referrer: string;
  createdAt: string;
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
  });
  const [logsPage, setLogsPage] = useState(1);
  const [isLogsLoading, setIsLogsLoading] = useState(false);

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
        const response = await fetch(
          `${backendBaseUrl}/stats/messenger-clicks?page=${logsPage}&limit=50`,
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
          });
        }
      } catch (error) {
        console.error("Failed to fetch messenger stats", error);
      } finally {
        setIsLogsLoading(false);
      }
    };
    fetchMessengerStats();
  }, [logsPage]);

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

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Messenger Click Logs</h2>
            <p className="text-sm text-slate-500">
              Track who clicked (by IP) and the exact time of each click.
            </p>
          </div>
          <div className="text-sm text-slate-600">
            {messengerStats.totalClicks.toLocaleString()} total clicks
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">#</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">IP Address</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Timestamp</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Referrer</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">User Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLogsLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Loading logs...
                  </td>
                </tr>
              ) : messengerStats.clickLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No messenger click logs found.
                  </td>
                </tr>
              ) : (
                messengerStats.clickLogs.map((log, index) => (
                  <tr key={log._id}>
                    <td className="px-4 py-3 text-slate-600">
                      {(messengerStats.page - 1) * messengerStats.limit + index + 1}
                    </td>
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

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 sm:px-6">
          <p className="text-sm text-slate-500">
            Page {messengerStats.page} of {messengerStats.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLogsPage((current) => Math.max(1, current - 1))}
              disabled={logsPage <= 1 || isLogsLoading}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() =>
                setLogsPage((current) =>
                  Math.min(messengerStats.totalPages, current + 1)
                )
              }
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
