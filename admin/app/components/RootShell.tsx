"use client";

import { usePathname } from "next/navigation";
import AdminShell from "./AdminShell";

type RootShellProps = {
  children: React.ReactNode;
};

export default function RootShell({ children }: RootShellProps) {
  const pathname = usePathname();
  if (pathname === "/login") return <>{children}</>;
  return <AdminShell>{children}</AdminShell>;
}
