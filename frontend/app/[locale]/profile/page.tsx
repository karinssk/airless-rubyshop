"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { backendBaseUrl } from "@/lib/urls";
import { Link } from "@/lib/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = window.localStorage.getItem("customerAuth");
      const email = window.localStorage.getItem("customerEmail");
      const prov = window.localStorage.getItem("customerProvider");

      if (auth !== "true") {
        router.push("/");
        return;
      }

      setIsLoggedIn(true);
      setCustomerEmail(email);
      setProvider(prov);
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("customerAuth");
      window.localStorage.removeItem("customerToken");
      window.localStorage.removeItem("customerEmail");
      window.localStorage.removeItem("customerProvider");
    }
    router.push("/");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setPasswordMessage("กรุณากรอกรหัสผ่านใหม่");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage(null);

    try {
      const token = window.localStorage.getItem("customerToken");
      const res = await fetch(`${backendBaseUrl}/auth/customer/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordMessage(data.error || "ไม่สามารถเปลี่ยนรหัสผ่านได้");
        return;
      }

      setPasswordMessage("เปลี่ยนรหัสผ่านสำเร็จ");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Change password error:", error);
      setPasswordMessage("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="mx-auto max-w-2xl px-4">
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-400">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-2xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-500"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-slate-900">โปรไฟล์</h1>
          <p className="text-slate-600">จัดการบัญชีของคุณ</p>
        </div>

        {/* Account Info */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">ข้อมูลบัญชี</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-500">อีเมล</label>
              <p className="mt-1 text-base font-medium text-slate-900">{customerEmail}</p>
            </div>
            {provider && (
              <div>
                <label className="block text-sm text-slate-500">เข้าสู่ระบบด้วย</label>
                <p className="mt-1 text-base font-medium text-slate-900 capitalize">
                  {provider === "local" ? "อีเมลและรหัสผ่าน" : provider}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Change Password - Only for local auth */}
        {(!provider || provider === "local") && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">เปลี่ยนรหัสผ่าน</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-500">รหัสผ่านปัจจุบัน</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  placeholder="กรอกรหัสผ่านปัจจุบัน"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-500">รหัสผ่านใหม่</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  placeholder="กรอกรหัสผ่านใหม่"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-500">ยืนยันรหัสผ่านใหม่</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                />
              </div>
              {passwordMessage && (
                <p
                  className={`text-sm ${
                    passwordMessage.includes("สำเร็จ") ? "text-green-600" : "text-rose-500"
                  }`}
                >
                  {passwordMessage}
                </p>
              )}
              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
              >
                {passwordLoading ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
              </button>
            </form>
          </div>
        )}

        {/* Quick Links */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">ลิงก์ด่วน</h2>
          <div className="space-y-2">
            <Link
              href="/my-booking"
              className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <span>ค้นหาการจอง</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
            <Link
              href="/rooms"
              className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <span>ดูห้องพัก</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full rounded-2xl border-2 border-rose-200 bg-white px-4 py-4 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
        >
          ออกจากระบบ
        </button>
      </div>
    </div>
  );
}
