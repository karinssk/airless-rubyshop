import type { Metadata } from "next";
import { Manrope, Prompt } from "next/font/google";
import "./globals.css";
import RootShell from "./components/RootShell";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RUBYSHOP Admin",
  description: "Admin dashboard for RUBYSHOP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${manrope.variable} ${prompt.variable} antialiased`}>
        <RootShell>{children}</RootShell>
      </body>
    </html>
  );
}
