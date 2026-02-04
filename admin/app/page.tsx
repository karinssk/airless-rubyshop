"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { backendBaseUrl } from "@/lib/urls";

type VisitorStats = {
  totalViews: number;
  totalVisitors: number;
};

export default function Dashboard() {
  const [stats, setStats] = useState<VisitorStats>({
    totalViews: 0,
    totalVisitors: 0,
  });

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

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back to RUBYSHOP Panel</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Link
          href="/rooms"
          className="group block p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition"
        >
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          </div>
          <h3 className="font-semibold text-lg text-slate-800">Rooms</h3>
          <p className="text-sm text-slate-500 mt-1">Manage catalog, inventory, and brands</p>
        </Link>

        <Link
          href="/chat"
          className="group block p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition"
        >
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
          <h3 className="font-semibold text-lg text-slate-800">Inbox</h3>
          <p className="text-sm text-slate-500 mt-1">Answer customer inquiries</p>
        </Link>

        <Link
          href="/calendar-reservation"
          className="group block p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition"
        >
          <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <h3 className="font-semibold text-lg text-slate-800">Calendar</h3>
          <p className="text-sm text-slate-500 mt-1">View reservation calendar</p>
        </Link>

        <Link
          href="/bookings"
          className="group block p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition"
        >
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          </div>
          <h3 className="font-semibold text-lg text-slate-800">Bookings</h3>
          <p className="text-sm text-slate-500 mt-1">Manage reservations and guests</p>
        </Link>
      </div>
    </div>
  );
}
