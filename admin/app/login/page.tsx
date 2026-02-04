"use client";

import { useEffect, useState } from "react";
import { backendBaseUrl } from "@/lib/urls";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const status = params.get("status");
    const error = params.get("error");
    if (token) {
      window.localStorage.setItem("adminToken", token);
      window.location.href = "/";
      return;
    }
    if (status === "pending") {
      setMessage("บัญชีของคุณกำลังรอการอนุมัติจากเจ้าของระบบ");
    }
    if (error) {
      setMessage("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่");
    }
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setMessage(null);
    const response = await fetch(`${backendBaseUrl}/auth/staff-signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const raw = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(raw);
    } catch {
      setLoading(false);
      setMessage(`Login failed (${response.status})`);
      return;
    }
    setLoading(false);
    if (response.ok && data.token) {
      window.localStorage.setItem("adminToken", data.token);
      window.location.href = "/";
      return;
    }
    if (data.status === "pending") {
      setMessage("บัญชีของคุณกำลังรอการอนุมัติจากเจ้าของระบบ");
      return;
    }
    setMessage(data.error || "เข้าสู่ระบบไม่สำเร็จ");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="text-xl font-semibold text-slate-800">Admin Login</h1>
        <p className="mt-1 text-xs text-slate-400">
          ใช้บัญชีที่ได้รับอนุมัติจาก Owner
        </p>
        <div className="mt-6 grid gap-3">
          <label className="text-xs text-slate-500">Email</label>
          <input
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label className="text-xs text-slate-500">Password</label>
          <input
            type="password"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            onClick={handleLogin}
            disabled={loading}
            className="rounded-xl bg-[var(--admin-navy)] px-4 py-2 text-sm font-semibold text-white"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
          {message && <p className="text-xs text-rose-500">{message}</p>}
        </div>

      </div>
    </div>
  );
}
