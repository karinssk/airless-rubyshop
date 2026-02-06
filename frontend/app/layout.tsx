// This root layout is required by Next.js but won't be rendered
// because the middleware redirects all requests to /[locale]
import { Prompt } from "next/font/google";
import GoogleAnalytics from "./components/GoogleAnalytics";
import Script from "next/script";

// Load Prompt font (Thai + Latin)
const prompt = Prompt({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-prompt",
});

// Get backend URL for preconnect hints (only use production URL to avoid localhost access prompts)
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_PRODUCTION_URL || "";

// Only preconnect to non-localhost URLs
const shouldPreconnect = backendUrl && !backendUrl.includes("localhost");

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={prompt.variable}>
      <head>
        {/* Google Tag Manager */}
        <Script
          id="gtm-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-N6CNLKHW');`,
          }}
        />
        {/* End Google Tag Manager */}
        {/* Preconnect to backend API for faster data fetching */}
        {shouldPreconnect && (
          <>
            <link rel="preconnect" href={backendUrl} />
            <link rel="dns-prefetch" href={backendUrl} />
          </>
        )}
      </head>
      <body className={prompt.className}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-N6CNLKHW"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
