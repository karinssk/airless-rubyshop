// This root layout is required by Next.js but won't be rendered
// because the middleware redirects all requests to /[locale]
import { Prompt } from "next/font/google";
import GoogleAnalytics from "./components/GoogleAnalytics";

// Load Prompt font (Thai + Latin)
const prompt = Prompt({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-prompt",
});

// Get backend URL for preconnect hints
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_PRODUCTION_URL
  || process.env.NEXT_PUBLIC_BACKEND_DEVELOPMENT_URL
  || "";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={prompt.variable}>
      <head>
        {/* Preconnect to backend API for faster data fetching */}
        {backendUrl && (
          <>
            <link rel="preconnect" href={backendUrl} />
            <link rel="dns-prefetch" href={backendUrl} />
          </>
        )}
      </head>
      <body className={prompt.className}>
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
