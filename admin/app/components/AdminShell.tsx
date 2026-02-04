"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import BottomNavigation from "./BottomNavigation";
import { backendBaseUrl } from "@/lib/urls";
import { usePathname } from "next/navigation";

type AdminShellProps = {
  children: React.ReactNode;
  mainClassName?: string;
};

export default function AdminShell({ children, mainClassName }: AdminShellProps) {
  const [ready, setReady] = useState(false);
  const [adminRole, setAdminRole] = useState("admin");
  const pathname = usePathname();
  const hideSidebar =
    pathname.startsWith("/pages") || pathname.startsWith("/email-templates");

  const isOwner = useMemo(() => adminRole === "owner", [adminRole]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("adminToken");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    fetch(`${backendBaseUrl}/admin/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) {
          window.localStorage.removeItem("adminToken");
          window.location.href = "/login";
          return;
        }
        return response.json();
      })
      .then((data) => {
        if (data?.user?.role) {
          setAdminRole(data.user.role);
        }
        setReady(true);
      })
      .catch(() => {
        window.localStorage.removeItem("adminToken");
        window.location.href = "/login";
      });
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!backendBaseUrl) return;
    fetch(`${backendBaseUrl}/admin-menu`)
      .then((response) => response.json())
      .then((data) => {
        const items = data?.menu?.items || [];
        const findPermission = (list: any[]): string | null => {
          for (const item of list) {
            const href = item?.href || "";
            if (href && (pathname === href || (href !== "/" && pathname.startsWith(href)))) {
              return item.permission || "everyone";
            }
            if (item.children?.length) {
              const childPermission = findPermission(item.children);
              if (childPermission) return childPermission;
            }
          }
          return null;
        };
        const permission = findPermission(items);
        if (permission === "owner-only" && !isOwner) {
          window.location.href = "/chat";
        }
      })
      .catch(() => null);
  }, [isOwner, pathname, ready]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Hide sidebar on mobile, show on desktop */}
      {!hideSidebar && <AdminSidebar />}
      <main className={`flex-1 ${mainClassName || "px-4 py-6 lg:px-8 lg:py-10"} pb-20 sm:pb-6 lg:pb-10`}>
        {children}
      </main>
      {/* Show bottom navigation only on mobile */}
      <BottomNavigation />
    </div>
  );
}
