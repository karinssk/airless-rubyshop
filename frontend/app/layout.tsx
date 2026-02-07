// This root layout is required by Next.js but won't be rendered
// because the middleware redirects all requests to /[locale]
import { Prompt } from "next/font/google";
import TrackingScripts from "./components/TrackingScripts";

// Load Prompt font (Thai + Latin)
const prompt = Prompt({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
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
      <body className={prompt.className}>
        <TrackingScripts />
        {children}
      </body>
    </html>
  );
}
