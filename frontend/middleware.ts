import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale } from "./i18n";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

const resolveBackendUrl = () => {
  if (process.env.NODE_ENV === "production") {
    return (
      process.env.NEXT_PUBLIC_BACKEND_PRODUCTION_URL ||
      process.env.NEXT_PUBLIC_BACKEND_DEVELOPMENT_URL ||
      ""
    );
  }
  return process.env.NEXT_PUBLIC_BACKEND_DEVELOPMENT_URL || "";
};

export default async function middleware(request: NextRequest) {
  const response = intlMiddleware(request) as NextResponse;
  const pathname = request.nextUrl.pathname;
  const isPrefetch =
    request.headers.get("x-middleware-prefetch") === "1" ||
    request.headers.get("purpose") === "prefetch";

  if (!isPrefetch && (pathname === "/" || pathname.startsWith("/th/") || pathname.startsWith("/en/"))) {
    const backendUrl = resolveBackendUrl();
    if (backendUrl) {
      const visitorCookie = request.cookies.get("visitor_id")?.value;
      const isNewVisitor = !visitorCookie;
      const visitorId = visitorCookie || crypto.randomUUID();
      if (isNewVisitor) {
        response.cookies.set("visitor_id", visitorId, {
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
        });
      }

      try {
        await fetch(`${backendUrl}/stats/visit`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ newVisitor: isNewVisitor }),
        });
      } catch {
        // Fail silently to avoid blocking page render
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/", "/(th|en)/:path*"],
};
