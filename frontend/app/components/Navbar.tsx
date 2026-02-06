"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { locales, type Locale } from "@/i18n";
import { resolveUploadUrl } from "@/lib/urls";
import { Link } from "@/lib/navigation";
import { backendBaseUrl } from "@/lib/urls";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  children?: NavItem[];
};

type NavCta = {
  label: string;
  href: string;
};

function NavSubMenuItem({ item }: { item: NavItem }) {
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className="relative group/submenu">
      <Link
        href={item.href}
        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors border-l-2 border-transparent hover:border-black hover:bg-slate-100"
      >
        <span className="font-medium">{item.label}</span>
        {hasChildren && <span className="text-slate-400 text-sm">›</span>}
      </Link>
      {hasChildren && (
        <div className="absolute left-full top-0 ml-1 w-56 rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-2xl opacity-0 invisible -translate-x-2 transition-all duration-200 group-hover/submenu:opacity-100 group-hover/submenu:visible group-hover/submenu:translate-x-0 pointer-events-none group-hover/submenu:pointer-events-auto">
          <div className="grid gap-1">
            {item.children!.map((subChild) => (
              <Link
                key={subChild.id}
                href={subChild.href}
                className="block rounded-lg px-3 py-2 text-sm transition-colors border-l-2 border-transparent hover:border-black hover:bg-slate-100"
              >
                <div className="font-medium text-slate-700">{subChild.label}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NavDropdownItem({ item }: { item: NavItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const hasChildren = item.children && item.children.length > 0;

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href={item.href}
        className="flex min-w-0 items-center gap-2 rounded-full px-3 py-2 text-center whitespace-nowrap transition hover:bg-slate-100 max-w-[160px]"
      >
        <span className="block flex-1 truncate">{item.label}</span>
        {hasChildren && <span className="text-xs">▾</span>}
      </Link>
      {hasChildren && (
        <div
          className={`absolute left-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-2xl transition-all duration-200 ${isOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-1 opacity-0"
            }`}
        >
          <div className="grid gap-1">
            {item.children!.map((child) => (
              <NavSubMenuItem key={child.id} item={child} />
            ))}
          </div>
          {/* Dropdown arrow pointer */}
          <div className="absolute -top-2 left-4 h-4 w-4 rotate-45 border-l border-t border-slate-200 bg-white"></div>
        </div>
      )}
    </div>
  );
}

export default function Navbar({
  items,
  cta,
  logoUrl,
}: {
  items: NavItem[];
  cta?: NavCta;
  logoUrl?: string;
}) {
  const fallbackLogo = "/uploads/logo/rubyshop-no-bg-250pxx100px.jpg";
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpenIds, setMobileOpenIds] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = window.localStorage.getItem("customerAuth");
      const email = window.localStorage.getItem("customerEmail");
      setIsLoggedIn(auth === "true");
      setCustomerEmail(email);
    }
  }, []);

  const isActivePath = (href: string) => {
    if (!href) return false;
    if (pathname === href) return true;
    if (href !== "/" && pathname?.startsWith(`${href}/`)) return true;
    return false;
  };

  const collectActiveIds = (navItems: NavItem[]): string[] => {
    for (const item of navItems) {
      const childIds = item.children ? collectActiveIds(item.children) : [];
      if (isActivePath(item.href) || childIds.length > 0) {
        return [item.id, ...childIds];
      }
    }
    return [];
  };

  const navIndex = useMemo(() => {
    const parentById = new Map<string, string | null>();
    const childrenById = new Map<string, string[]>();
    const walk = (item: NavItem, parentId: string | null) => {
      parentById.set(item.id, parentId);
      if (item.children && item.children.length > 0) {
        childrenById.set(
          item.id,
          item.children.map((child) => child.id)
        );
        item.children.forEach((child) => walk(child, item.id));
      }
    };
    items.forEach((item) => walk(item, null));
    return { parentById, childrenById };
  }, [items]);

  const getAncestorChain = (id: string) => {
    const chain: string[] = [];
    let current: string | null | undefined = id;
    while (current) {
      chain.unshift(current);
      current = navIndex.parentById.get(current) || null;
    }
    return chain;
  };

  const getDescendantIds = (id: string) => {
    const result: string[] = [];
    const stack: string[] = [id];
    while (stack.length > 0) {
      const current = stack.pop()!;
      result.push(current);
      const children = navIndex.childrenById.get(current) || [];
      children.forEach((child) => stack.push(child));
    }
    return result;
  };

  useEffect(() => {
    if (!mobileOpen) return;
    const activeIds = collectActiveIds(items);
    if (activeIds.length === 0) return;
    setMobileOpenIds((prev) => Array.from(new Set([...prev, ...activeIds])));
  }, [mobileOpen, pathname, items]);

  const toggleMobileSection = (id: string) => {
    setMobileOpenIds((prev) => {
      if (prev.includes(id)) {
        const toRemove = new Set(getDescendantIds(id));
        return prev.filter((entry) => !toRemove.has(entry));
      }
      return getAncestorChain(id);
    });
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("customerAuth");
      window.localStorage.removeItem("customerToken");
      window.localStorage.removeItem("customerEmail");
      window.localStorage.removeItem("customerProvider");
    }
    setIsLoggedIn(false);
    setCustomerEmail(null);
    setProfileOpen(false);
    router.refresh();
  };

  const handleEmailLogin = async () => {
    setStatusMessage("กำลังเข้าสู่ระบบ...");
    try {
      const res = await fetch(`${backendBaseUrl}/auth/customer/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusMessage(data.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        return;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("customerAuth", "true");
        window.localStorage.setItem("customerToken", data.token);
        window.localStorage.setItem("customerEmail", data.user.email);
        window.localStorage.removeItem("customerProvider");
      }

      setIsLoggedIn(true);
      setCustomerEmail(data.user.email);
      setAuthOpen(false);
      setStatusMessage("เข้าสู่ระบบสำเร็จ");
      setTimeout(() => setStatusMessage(null), 2000);
      router.refresh();
    } catch (error) {
      console.error("Login failed", error);
      setStatusMessage("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    }
  };

  const handleRegister = async () => {
    if (!email.trim()) {
      setStatusMessage("กรุณากรอกอีเมล");
      return;
    }
    if (!password) {
      setStatusMessage("กรุณากรอกรหัสผ่าน");
      return;
    }
    if (password !== confirmPassword) {
      setStatusMessage("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setStatusMessage("กำลังสมัครสมาชิก...");
    try {
      const res = await fetch(`${backendBaseUrl}/auth/customer/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusMessage(data.error || "ไม่สามารถสมัครสมาชิกได้");
        return;
      }

      // Auto login after register
      if (typeof window !== "undefined") {
        window.localStorage.setItem("customerAuth", "true");
        window.localStorage.setItem("customerToken", data.token);
        window.localStorage.setItem("customerEmail", data.user.email);
        window.localStorage.removeItem("customerProvider");
      }

      setIsLoggedIn(true);
      setCustomerEmail(data.user.email);
      setStatusMessage("สมัครสมาชิกสำเร็จ");
      setTimeout(() => {
        setStatusMessage(null);
        setAuthOpen(false);
      }, 1500);
      router.refresh();
    } catch (error) {
      console.error("Register failed", error);
      setStatusMessage("เกิดข้อผิดพลาดในการสมัครสมาชิก");
    }
  };

  const resetAuthForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setStatusMessage(null);
  };

  const handleSocialLogin = async (provider: "google" | "line") => {
    const redirectUrl = `${backendBaseUrl}/auth/${provider}`;
    window.location.href = redirectUrl;
  };

  const handleLanguageChange = (newLocale: Locale) => {
    const pathnameWithoutLocale = pathname.replace(`/${locale}`, "");
    router.push(`/${newLocale}${pathnameWithoutLocale}`);
    setLanguageOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white text-black">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-6 lg:py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 lg:hidden"
              aria-label="Open menu"
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              ☰
            </button>
            <Link href="/" className="flex items-center gap-3 text-lg font-semibold">
              <span className="flex h-10 w-[140px] items-center justify-center rounded-md bg-white px-1">
                {logoUrl || fallbackLogo ? (
                  <img
                    src={resolveUploadUrl(logoUrl || fallbackLogo)}
                    alt="Logo"
                    className="h-full w-full object-contain"
                  />
                ) : null}
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <div className="relative">
              <button
                type="button"
                onClick={() => setLanguageOpen((prev) => !prev)}
                className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold uppercase"
                aria-label="Language"
              >
                {locale}
                <span className="text-[10px]">▾</span>
              </button>
              {languageOpen && (
                <div className="absolute right-0 top-full z-10 mt-2 w-24 rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-xl">
                  {locales.map((lng) => (
                    <button
                      key={lng}
                      onClick={() => handleLanguageChange(lng)}
                      className={`w-full rounded-lg px-2 py-1 text-left uppercase ${lng === locale ? "bg-slate-900 text-white" : "hover:bg-slate-100"
                        }`}
                    >
                      {lng}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {cta ? (
              <Link
                href={cta.href}
                className="hidden rounded-full bg-black px-4 py-2 text-xs font-semibold text-white lg:inline-flex"
              >
                {cta.label}
              </Link>
            ) : null}
          </div>

          <div className="hidden flex-wrap items-center gap-4 text-sm lg:flex">
            {items.map((item) => (
              <NavDropdownItem key={item.id} item={item} />
            ))}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLanguageOpen((prev) => !prev)}
                className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold uppercase"
                aria-label="Language"
              >
                {locale}
                <span className="text-[10px]">▾</span>
              </button>
              {languageOpen && (
                <div className="absolute right-0 top-full z-10 mt-2 w-24 rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-xl">
                  {locales.map((lng) => (
                    <button
                      key={lng}
                      onClick={() => handleLanguageChange(lng)}
                      className={`w-full rounded-lg px-2 py-1 text-left uppercase ${lng === locale ? "bg-slate-900 text-white" : "hover:bg-slate-100"
                        }`}
                    >
                      {lng}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                  aria-label="Profile"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full z-10 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                    <div className="border-b border-slate-100 px-3 py-2 mb-2">
                      <p className="text-xs text-slate-400">เข้าสู่ระบบแล้ว</p>
                      <p className="text-sm font-medium text-slate-700 truncate">{customerEmail}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      โปรไฟล์
                    </Link>
                    <Link
                      href="/my-booking"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      การจองของฉัน
                    </Link>
                    <div className="border-t border-slate-100 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        ออกจากระบบ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Sign-in
              </button>
            )}
            {cta && !/book/i.test(cta.label) ? (
              <Link
                href={cta.href}
                className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                target={cta.href.startsWith("http") ? "_blank" : undefined}
                rel={cta.href.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                {cta.label}
              </Link>
            ) : null}
          </div>
        </div>
        {mobileOpen && (
          <div className="border-t border-slate-200 bg-white lg:hidden">
            <div className="mx-auto grid max-w-6xl gap-4 px-4 py-4">
              {items.map((item) => {
                const renderMobileItem = (navItem: NavItem, level = 0) => {
                  const hasChildren = Boolean(navItem.children && navItem.children.length > 0);
                  const isOpen = mobileOpenIds.includes(navItem.id);
                  const isActive = isActivePath(navItem.href);
                  const textClass =
                    level === 0
                      ? "text-sm font-semibold text-slate-900"
                      : level === 1
                        ? "text-xs font-medium text-slate-700"
                        : "text-[11px] text-slate-500";
                  const paddingLeft = 4 + level * 10;

                  return (
                    <div key={navItem.id} className="grid gap-1">
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => toggleMobileSection(navItem.id)}
                          aria-expanded={isOpen}
                          className="flex w-full items-center justify-between gap-2"
                          style={{ paddingLeft }}
                        >
                          <span className={`${textClass} whitespace-normal leading-snug ${isActive ? "text-[var(--brand-navy)]" : ""}`}>
                            {navItem.label}
                          </span>
                          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className={`h-3.5 w-3.5 transition ${isOpen ? "rotate-90" : ""}`}
                            >
                              <path
                                fillRule="evenodd"
                                d="M7.21 5.23a.75.75 0 011.06-.02l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 11-1.04-1.08L11.19 10 7.23 6.33a.75.75 0 01-.02-1.06z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                        </button>
                      ) : (
                        <Link
                          href={navItem.href}
                          className={`${textClass} whitespace-normal leading-snug ${isActive ? "text-[var(--brand-navy)]" : ""}`}
                          style={{ paddingLeft }}
                        >
                          {navItem.label}
                        </Link>
                      )}
                      {hasChildren && (
                        <div
                          className={`grid gap-1 border-l border-slate-200 pl-3 ${isOpen ? "block" : "hidden"}`}
                        >
                          {navItem.children!.map((child) => renderMobileItem(child, level + 1))}
                        </div>
                      )}
                    </div>
                  );
                };

                return renderMobileItem(item, 0);
              })}
              <div className="flex items-center gap-3 pt-2">
                {isLoggedIn ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span className="text-xs text-slate-600 max-w-[120px] truncate">{customerEmail}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="rounded-full border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600"
                    >
                      ออกจากระบบ
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAuthOpen(true)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                  >
                    Sign-in
                  </button>
                )}
                {cta && !/book/i.test(cta.label) ? (
                  <Link
                    href={cta.href}
                    className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white"
                  >
                    {cta.label}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </nav>

      {authOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <button
              onClick={() => {
                setAuthOpen(false);
                resetAuthForm();
              }}
              className="absolute right-4 top-4 z-10 text-slate-400 hover:text-slate-600"
              aria-label="Close"
            >
              ✕
            </button>
            <div className="grid md:grid-cols-[1.1fr_1fr]">
              <div className="flex flex-col items-center justify-center gap-3 bg-white px-6 py-10 text-center">
                <div className="h-20 w-20 overflow-hidden rounded-full border border-slate-100 bg-white p-1">
                  <img
                    src={resolveUploadUrl(logoUrl || fallbackLogo)}
                    alt="RUBYSHOP"
                    className="h-full w-full object-contain rounded-full"
                  />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  RUBYSHOP
                </h3>
                <p className="text-sm text-slate-500">
                  ยินดีต้อนรับสู่โรงแรมเดอะวังเยาวราช
                </p>
                <p className="mt-4 text-xs text-slate-400">
                  Welcome to RUBYSHOP Hotel
                </p>
              </div>
              <div className="border-l border-slate-100 px-6 py-10">
                {/* Tabs */}
                <div className="flex gap-4 border-b border-slate-200 mb-6">
                  <button
                    onClick={() => {
                      setAuthMode("login");
                      resetAuthForm();
                    }}
                    className={`pb-3 text-sm font-semibold transition-colors ${authMode === "login"
                      ? "border-b-2 border-slate-900 text-slate-900"
                      : "text-slate-400 hover:text-slate-600"
                      }`}
                  >
                    เข้าสู่ระบบ
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode("register");
                      resetAuthForm();
                    }}
                    className={`pb-3 text-sm font-semibold transition-colors ${authMode === "register"
                      ? "border-b-2 border-slate-900 text-slate-900"
                      : "text-slate-400 hover:text-slate-600"
                      }`}
                  >
                    สมัครสมาชิก
                  </button>
                </div>

                {authMode === "login" ? (
                  <>
                    {/* Login Mode */}
                    <div className="grid gap-3">
                      {/* Google Login */}
                      <button
                        onClick={() => handleSocialLogin("google")}
                        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all"
                        aria-label="Google"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span>Continue With Google</span>
                      </button>

                      {/* LINE Login */}
                      <button
                        onClick={() => handleSocialLogin("line")}
                        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border-2 border-[#06C755] bg-[#06C755] text-sm font-semibold text-white hover:bg-[#05b34c] transition-all"
                        aria-label="Line"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                        </svg>
                        <span>Continue With LINE</span>
                      </button>
                    </div>

                    <div className="my-5 flex items-center gap-3">
                      <div className="h-px flex-1 bg-slate-200" />
                      <span className="text-xs text-slate-400">หรือ</span>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    {/* Email/Password Login */}
                    <div className="grid gap-3">
                      <label className="text-xs text-slate-500">อีเมล</label>
                      <input
                        type="email"
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="กรอกอีเมล"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <label className="text-xs text-slate-500">รหัสผ่าน</label>
                      <input
                        type="password"
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="กรอกรหัสผ่าน"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        onClick={handleEmailLogin}
                        className="rounded-xl bg-slate-900 px-3 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                      >
                        เข้าสู่ระบบ
                      </button>
                      {statusMessage && (
                        <p className={`text-xs ${statusMessage.includes("สำเร็จ") ? "text-green-600" : "text-rose-500"}`}>
                          {statusMessage}
                        </p>
                      )}
                    </div>

                  </>
                ) : (
                  <>
                    {/* Register Mode */}
                    <div className="grid gap-3">
                      <label className="text-xs text-slate-500">อีเมล</label>
                      <input
                        type="email"
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="กรอกอีเมล"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <label className="text-xs text-slate-500">รหัสผ่าน</label>
                      <input
                        type="password"
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="กรอกรหัสผ่าน"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <label className="text-xs text-slate-500">ยืนยันรหัสผ่าน</label>
                      <input
                        type="password"
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="กรอกรหัสผ่านอีกครั้ง"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        onClick={handleRegister}
                        className="rounded-xl bg-slate-900 px-3 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                      >
                        สมัครสมาชิก
                      </button>
                      {statusMessage && (
                        <p className={`text-xs ${statusMessage.includes("สำเร็จ") ? "text-green-600" : "text-rose-500"}`}>
                          {statusMessage}
                        </p>
                      )}
                    </div>

                    <div className="my-5 flex items-center gap-3">
                      <div className="h-px flex-1 bg-slate-200" />
                      <span className="text-xs text-slate-400">หรือสมัครด้วย</span>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    {/* Social Login for Register */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleSocialLogin("google")}
                        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all"
                        aria-label="Google"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span>Google</span>
                      </button>
                      <button
                        onClick={() => handleSocialLogin("line")}
                        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#06C755] bg-[#06C755] text-sm font-semibold text-white hover:bg-[#05b34c] transition-all"
                        aria-label="Line"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                        </svg>
                        <span>LINE</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
