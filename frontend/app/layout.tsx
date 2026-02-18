// This root layout is required by Next.js but won't be rendered
// because the middleware redirects all requests to /[locale]
import { Prompt } from "next/font/google";
import TrackingScripts from "./components/TrackingScripts";

// Prompt is loaded here so --font-prompt CSS variable is available on <html>
// for the body { font-family: var(--font-prompt) } rule in globals.css
const prompt = Prompt({
  subsets: ["latin", "thai"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-prompt",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={prompt.variable}>
      <head>
        <link rel="preconnect" href="https://api-airless-spray.rubyshop.co.th" />
        <link rel="dns-prefetch" href="https://api-airless-spray.rubyshop.co.th" />
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />
      </head>
      <body>
        <TrackingScripts />
        {children}
      </body>
    </html>
  );
}
