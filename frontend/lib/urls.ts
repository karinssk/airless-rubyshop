const normalizeBaseUrl = (value?: string) =>
  (value || "").replace(/\/+$/, "");

const isProduction = process.env.NODE_ENV === "production";

const frontendProductionUrl =
  process.env.NEXT_PUBLIC_FRONTEND_PRODUCTION_URL || "";
const frontendDevelopmentUrl =
  process.env.NEXT_PUBLIC_FRONTEND_DEVELOPMENT_URL || "";
const backendProductionUrl =
  process.env.NEXT_PUBLIC_BACKEND_PRODUCTION_URL || "";
const backendDevelopmentUrl =
  process.env.NEXT_PUBLIC_BACKEND_DEVELOPMENT_URL || "";

export const frontendBaseUrl = normalizeBaseUrl(
  isProduction
    ? frontendProductionUrl || "https://airless-spray.rubyshop.co.th"
    : frontendDevelopmentUrl || "http://localhost:5001"
);

export const backendBaseUrl = normalizeBaseUrl(
  isProduction
    ? backendProductionUrl || "https://api-airless-spray.rubyshop.co.th"
    : backendDevelopmentUrl || "https://api-airless-spray.rubyshop.co.th"
);


export const resolveUploadUrl = (value?: string) => {
  if (!value) return "";
  let cleaned = value;
  if (cleaned.startsWith("undefined/")) {
    cleaned = cleaned.replace("undefined", "");
  }
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    try {
      const parsed = new URL(cleaned);
      if (parsed.pathname.startsWith("/uploads")) {
        return `${backendBaseUrl || ""}${parsed.pathname}`;
      }
    } catch {
      return cleaned;
    }
    return cleaned;
  }
  if (cleaned.startsWith("/uploads/")) return `${backendBaseUrl || ""}${cleaned}`;
  if (cleaned.startsWith("uploads/")) return `${backendBaseUrl || ""}/${cleaned}`;
  return cleaned;
};
