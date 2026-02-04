"use client";

import { useEffect, useState } from "react";
import { backendBaseUrl } from "@/lib/urls";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

type AdminProfile = {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  color?: string;
  role: string;
  provider: string;
};

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [color, setColor] = useState("#2563eb");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const MySwal = withReactContent(Swal);

  const loadProfile = async () => {
    const token = window.localStorage.getItem("adminToken");
    if (!token) return;
    const response = await fetch(`${backendBaseUrl}/admin/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return;
    const data = await response.json();
    setProfile(data.user);
    if (data.user?.color) setColor(data.user.color);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const uploadAvatar = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    setUploadProgress(0);
    return new Promise<string>((resolve) => {
      const request = new XMLHttpRequest();
      request.open("POST", `${backendBaseUrl}/uploads`, true);
      request.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      };
      request.onload = () => {
        setUploading(false);
        setUploadProgress(0);
        if (request.status >= 200 && request.status < 300) {
          try {
            const data = JSON.parse(request.responseText);
            resolve(data.url || "");
          } catch {
            resolve("");
          }
          return;
        }
        resolve("");
      };
      request.onerror = () => {
        setUploading(false);
        setUploadProgress(0);
        resolve("");
      };
      request.send(formData);
    });
  };

  const saveProfile = async () => {
    if (!profile) return;
    const token = window.localStorage.getItem("adminToken");
    if (!token) return;
    const response = await fetch(`${backendBaseUrl}/admin/me`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: profile.name,
        avatar: profile.avatar,
        color,
      }),
    });
    if (response.ok) {
      setMessage("Saved");
      setTimeout(() => setMessage(null), 1200);
      MySwal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Profile saved",
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true,
      });
    }
  };

  return (
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Profile</h2>
            <p className="text-xs text-slate-400">
              ข้อมูลผู้ดูแลระบบ
            </p>
          </div>
          <button
            onClick={saveProfile}
            className="rounded-full bg-emerald-600 px-4 py-2 text-xs text-white"
          >
            Save
          </button>
        </header>

        {profile ? (
          <div className="mt-6 grid gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full bg-slate-100">
                {profile.avatar && (
                  <img
                    src={profile.avatar}
                    alt={profile.name || profile.email}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <label className="rounded-full border border-slate-200 px-4 py-2 text-xs">
                Upload Avatar
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const url = await uploadAvatar(file);
                    if (url) setProfile({ ...profile, avatar: url });
                  }}
                />
              </label>
              {uploading && (
                <div className="flex items-center gap-3">
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">
                    {uploadProgress}%
                  </span>
                </div>
              )}
            </div>
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Name
              </span>
              <input
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
                value={profile.name || ""}
                onChange={(event) =>
                  setProfile({ ...profile, name: event.target.value })
                }
              />
            </label>
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Profile Color
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white"
                />
                <input
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                />
                <span
                  className="inline-flex h-8 w-8 rounded-full border-2"
                  style={{ borderColor: color }}
                />
              </div>
            </label>
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </span>
              <input
                disabled
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                value={profile.email}
              />
            </label>
            <div className="grid gap-2 text-xs text-slate-500">
              <span>Role: {profile.role}</span>
              <span>Provider: {profile.provider}</span>
            </div>
            {message && <p className="text-xs text-emerald-600">{message}</p>}
          </div>
        ) : (
          <p className="mt-6 text-sm text-slate-500">Loading...</p>
        )}
      </div>
  );
}
