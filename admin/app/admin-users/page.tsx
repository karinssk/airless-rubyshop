"use client";

import { useEffect, useState } from "react";
import { backendBaseUrl, resolveUploadUrl } from "@/lib/urls";

type AdminUser = {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: string;
  status: string;
  provider: string;
  createdAt?: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const loadUsers = async () => {
    const token = window.localStorage.getItem("adminToken");
    if (!token) return;
    const response = await fetch(`${backendBaseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return;
    const data = await response.json();
    setUsers(data.users || []);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const approveUser = async (id: string) => {
    const token = window.localStorage.getItem("adminToken");
    if (!token) return;
    await fetch(`${backendBaseUrl}/admin/users/${id}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    setMessage("Approved");
    loadUsers();
    setTimeout(() => setMessage(null), 1200);
  };

  const rejectUser = async (id: string) => {
    const token = window.localStorage.getItem("adminToken");
    if (!token) return;
    await fetch(`${backendBaseUrl}/admin/users/${id}/reject`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    setMessage("Rejected");
    loadUsers();
    setTimeout(() => setMessage(null), 1200);
  };

  const updateUser = async (id: string, patch: Partial<AdminUser>) => {
    const token = window.localStorage.getItem("adminToken");
    if (!token) return;
    const response = await fetch(`${backendBaseUrl}/admin/users/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patch),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setMessage(data?.error || "Update failed");
      setTimeout(() => setMessage(null), 1600);
      return;
    }
    setMessage("Updated");
    loadUsers();
    setTimeout(() => setMessage(null), 1200);
  };

  const resetPassword = async (id: string, email: string) => {
    if (!confirm(`Reset password for ${email}?`)) return;
    const token = window.localStorage.getItem("adminToken");
    if (!token) return;
    const response = await fetch(
      `${backendBaseUrl}/admin/users/${id}/reset-password`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setMessage(data?.error || "Reset failed");
      setTimeout(() => setMessage(null), 1600);
      return;
    }
    const data = await response.json();
    setTempPassword(data.tempPassword);
    setMessage(`Temporary password for ${email}`);
  };

  const filteredUsers = users.filter((user) => {
    const target = `${user.email} ${user.name || ""}`.toLowerCase();
    return target.includes(search.toLowerCase());
  });

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
    }
    return (email || "AD").slice(0, 2).toUpperCase();
  };

  return (
    <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              Admin Users
            </h2>
            <p className="text-xs text-slate-400">
              Manage access, roles, and approvals
            </p>
          </div>
          {message && (
            <span className="text-xs text-emerald-600">{message}</span>
          )}
        </header>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email"
            className="w-full max-w-xs rounded-full border border-slate-200 px-4 py-2 text-xs text-slate-600"
          />
          {tempPassword && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
              Temp password: <span className="font-semibold">{tempPassword}</span>
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-3">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-200 text-xs font-semibold text-slate-600 flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <img
                      src={resolveUploadUrl(user.avatar)}
                      alt={user.name || user.email}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(user.name, user.email)
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {user.name || "Admin"}
                  </p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                  <p className="text-[10px] text-slate-400">
                    {user.provider} • {user.status}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={user.role}
                  onChange={(event) =>
                    updateUser(user.id, { role: event.target.value })
                  }
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                >
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
                <select
                  value={user.status}
                  onChange={(event) =>
                    updateUser(user.id, { status: event.target.value })
                  }
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                >
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="disabled">Disabled</option>
                </select>
                {user.status !== "approved" && (
                  <button
                    onClick={() => approveUser(user.id)}
                    className="rounded-full bg-emerald-600 px-3 py-1 text-xs text-white"
                  >
                    Approve
                  </button>
                )}
                <button
                  onClick={() =>
                    updateUser(user.id, {
                      status: user.status === "disabled" ? "approved" : "disabled",
                    })
                  }
                  className="rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-700"
                >
                  {user.status === "disabled" ? "Enable" : "Disable"}
                </button>
                <button
                  onClick={() => resetPassword(user.id, user.email)}
                  className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700"
                >
                  Reset Password
                </button>
                <button
                  onClick={() => rejectUser(user.id)}
                  className="rounded-full bg-rose-100 px-3 py-1 text-xs text-rose-700"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <p className="text-sm text-slate-400">No admin users.</p>
          )}
        </div>
    </div>
  );
}
