"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { backendBaseUrl, resolveUploadUrl } from "@/lib/urls";

type MenuItem = {
  id: string;
  label: string;
  href: string;
  icon?: string;
  permission?: "everyone" | "owner-only";
  children?: MenuItem[];
};

type AdminProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  color?: string;
};

const fallbackAdminMenu: MenuItem[] = [
  { id: "overview", label: "Overview", href: "/", permission: "everyone" },
  { id: "pages", label: "Pages", href: "/pages", permission: "everyone" },
  { id: "blog", label: "Blog", href: "/blog", permission: "everyone" },
  {
    id: "products",
    label: "Products",
    href: "",
    permission: "everyone",
    children: [
      { id: "products-list", label: "All Products", href: "/products", permission: "everyone" },
      { id: "products-new", label: "Add New", href: "/products/new", permission: "everyone" },
      { id: "products-categories", label: "Brands / Categories", href: "/products/categories", permission: "everyone" },
    ],
  },
  { id: "services", label: "Services", href: "/services", permission: "everyone" },
  {
    id: "settings",
    label: "Settings",
    href: "",
    permission: "everyone",
    children: [
      { id: "navbar", label: "Navbar", href: "/menu", permission: "everyone" },
      { id: "footer", label: "Footer", href: "/footer", permission: "everyone" },
      { id: "quick-links", label: "Quick Links", href: "/quick-links", permission: "everyone" },
      { id: "payment-setting", label: "Payment Setting", href: "/payment-setting", permission: "everyone" },
      { id: "email-templates", label: "Email Templates", href: "/email-templates", permission: "everyone" },
      { id: "popup-image", label: "Popup Image", href: "/popup-image", permission: "everyone" },
      { id: "admin-menu", label: "Admin Menu", href: "/admin-menu", permission: "owner-only" },
      { id: "profile", label: "Profile", href: "/profile", permission: "everyone" },
      { id: "admin-users", label: "Admin Approvals", href: "/admin-users", permission: "owner-only" },
    ],
  },
  { id: "forms", label: "Forms Submitted", href: "/forms-submitted", permission: "everyone" },
  { id: "media", label: "Media", href: "/media", permission: "everyone" },
  { id: "calendar", label: "Embedded Calendar", href: "/calendar-embedded", permission: "everyone" },
  { id: "calendar-custom", label: "Custom Calendar", href: "/calendar-customize", permission: "everyone" },
  { id: "chat", label: "Chat", href: "/chat", permission: "everyone" },
];

const iconMap: Record<string, string> = {
  overview: "M4 6h16M4 12h16M4 18h16",
  pages: "M6 4h12v16H6z",
  blog: "M5 6h14M5 11h14M5 16h9",
  services: "M6 6h12M6 12h12M6 18h8",
  products: "M4 6h16M4 10h16M4 14h16M4 18h16",
  menu: "M4 7h16M4 12h16M4 17h16",
  footer: "M4 16h16M6 6h12M6 10h12",
  "quick-links": "M5 12h14M12 5v14",
  "admin-menu": "M6 6h12M6 12h12M6 18h12",
  "forms-submitted": "M6 5h12v14H6z",
  media: "M5 7h14v10H5z",
  chat: "M6 7h12v8H9l-3 3z",
  calendar: "M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z",
  "calendar-custom": "M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z",
  profile: "M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zM6 20c0-3.3 2.7-6 6-6s6 2.7 6 6",
  "admin-users": "M7 9h10M7 13h10M7 17h6",
  "payment-setting": "M5 12h14M12 5v14",
  "email-templates": "M4 6h16M4 12h16M4 18h8",
  "popup-image": "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  settings: "M12 4l2 2 3-1 1 3 3 1-1 3 2 2-2 2 1 3-3 1-1 3-3-1-2 2-2-2-3 1-1-3-3-1 1-3-2-2 2-2-1-3 3-1 1-3 3 1z",
};

const resolveIconPath = (item: MenuItem) => {
  const key = item.href.replace("/", "") || item.label.toLowerCase();
  return (
    iconMap[key] ||
    iconMap[item.label.toLowerCase().replace(/\s+/g, "-")] ||
    iconMap.settings
  );
};

export default function AdminSidebar() {
  const [adminMenu, setAdminMenu] = useState<MenuItem[]>(fallbackAdminMenu);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (!backendBaseUrl) return;
    const cacheKey = "adminMenuCache";
    const cacheTimeKey = "adminMenuCacheTime";
    const cached = window.localStorage.getItem(cacheKey);
    const cachedTime = Number(window.localStorage.getItem(cacheTimeKey) || 0);
    const isFresh = cached && Date.now() - cachedTime < 10 * 60 * 1000;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setAdminMenu(parsed);
        }
      } catch {
        // ignore cache parse errors
      }
    }
    if (isFresh) return;
    fetch(`${backendBaseUrl}/admin-menu`)
      .then((response) => response.json())
      .then((data) => {
        const items = data.menu?.items || fallbackAdminMenu;
        setAdminMenu(items);
        window.localStorage.setItem(cacheKey, JSON.stringify(items));
        window.localStorage.setItem(cacheTimeKey, String(Date.now()));
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("adminToken");
    if (!token || !backendBaseUrl) return;
    fetch(`${backendBaseUrl}/admin/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data?.user?.id) {
          setAdminProfile({
            id: data.user.id,
            name: data.user.name || "Admin",
            email: data.user.email || "",
            role: data.user.role || "admin",
            avatar: data.user.avatar || "",
          });
        }
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("adminSidebarCollapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("adminSidebarCollapsed", String(collapsed));
  }, [collapsed]);

  const sidebarWidth = collapsed ? "w-20" : "w-64";
  const menuItems = useMemo(() => {
    const role = adminProfile?.role || "admin";
    const isOwner = role === "owner";
    const filterItems = (items: MenuItem[]): MenuItem[] =>
      items
        .map((item) => {
          const permission = item.permission || "everyone";
          if (permission === "owner-only" && !isOwner) return null;
          const children = item.children ? filterItems(item.children) : [];
          if (!item.href && children.length === 0) return null;
          return { ...item, children };
        })
        .filter(Boolean) as MenuItem[];
    return filterItems(adminMenu);
  }, [adminMenu, adminProfile?.role]);
  const initials = adminProfile?.name
    ? adminProfile.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("")
    : "AD";
  const profileColor = adminProfile?.color || "#2563eb";

  const handleLogout = () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem("adminToken");
    window.location.href = "/login";
  };

  return (
    <aside
      className={`${collapsed ? "w-20" : "w-72"} hidden lg:flex flex-col min-h-screen bg-white px-4 py-5 shadow-lg transition-all border-r border-slate-100/50`}
    >
      <div className="flex items-center justify-between gap-2">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 14l6-6 6 6" />
                <path d="M6 20l6-6 6 6" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900">
                RUBYSHOP
              </h1>
              <p className="text-[10px] text-slate-400">
                Dashboard & Content Studio
              </p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
          aria-label="Toggle sidebar"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      <div className="mt-4 h-px w-full bg-slate-100" />

      <nav className="mt-4 grid gap-1 text-sm">
        {menuItems.map((item) => {
          const hasChildren = (item.children || []).length > 0;
          const isExpanded = expandedGroups.includes(item.id);
          const iconPath = resolveIconPath(item);

          return (
            <div key={item.id} className="grid gap-1">
              {item.href ? (
                <Link
                  href={item.href}
                  className="group flex items-center gap-3 rounded-2xl px-3 py-2 text-slate-600 hover:bg-slate-100"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                    {item.icon ? (
                      <img
                        src={resolveUploadUrl(item.icon)}
                        alt=""
                        className="h-5 w-5 object-contain"
                      />
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d={iconPath} />
                      </svg>
                    )}
                  </span>
                  {!collapsed && (
                    <span className="text-sm text-slate-700">
                      {item.label}
                    </span>
                  )}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => toggleGroup(item.id)}
                  className="group flex items-center justify-between rounded-2xl px-3 py-2 text-left text-slate-600 hover:bg-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                      {item.icon ? (
                        <img
                          src={resolveUploadUrl(item.icon)}
                          alt=""
                          className="h-5 w-5 object-contain"
                        />
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          width="18"
                          height="18"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d={iconPath} />
                        </svg>
                      )}
                    </span>
                    {!collapsed && (
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {item.label}
                      </span>
                    )}
                  </div>
                  {!collapsed && (
                    <span className="text-xs text-slate-400">
                      {isExpanded ? "▴" : "▾"}
                    </span>
                  )}
                </button>
              )}
              {hasChildren && (!collapsed && isExpanded) && (
                <div className="ml-5 grid gap-1 border-l border-slate-200 pl-3">
                  {item.children?.map((child) => (
                    <Link
                      key={child.id}
                      href={child.href || "#"}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-100"
                    >
                      {child.icon ? (
                        <img
                          src={resolveUploadUrl(child.icon)}
                          alt=""
                          className="h-3 w-3 object-contain"
                        />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-slate-300" />
                      )}
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="my-4 h-px w-full bg-slate-100" />
        <div className="flex items-center gap-3 rounded-2xl px-3 py-2">
          <div
            className="h-9 w-9 rounded-full border-2 bg-slate-200 overflow-hidden text-[11px] font-semibold text-slate-600 flex items-center justify-center"
            style={{ borderColor: profileColor }}
          >
            {adminProfile?.avatar ? (
              <img
                src={resolveUploadUrl(adminProfile.avatar)}
                alt={adminProfile.name}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          {!collapsed && (
            <div className="text-xs text-slate-500">
              <p className="font-semibold text-slate-800">
                {adminProfile?.name || "Admin"}
              </p>
              <p>{adminProfile?.email || ""}</p>
            </div>
          )}
          {!collapsed && (
            <button
              className="ml-auto text-slate-400"
              onClick={handleLogout}
            >
              Logout
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={handleLogout}
            className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"
          >
            Logout
          </button>
        )}
      </div>
    </aside >
  );
}
