const isProduction = process.env.NODE_ENV === "production";

const normalizeBaseUrl = (value) => String(value || "").replace(/\/+$/, "");

const resolveBaseUrl = (productionKey, developmentKey) => {
    const productionUrl = process.env[productionKey];
    const developmentUrl = process.env[developmentKey];
    const selected = isProduction ? productionUrl : developmentUrl;
    return normalizeBaseUrl(selected || productionUrl || developmentUrl);
};

const nowDate = () => new Date();

const formatDate = (value) => (value ? new Date(value).toISOString() : null);

const retentionDate = (baseDate = new Date()) =>
    new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

const slugify = (value) =>
    String(value || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\u0E00-\u0E7F]+/g, "-")
        .replace(/(^-|-$)+/g, "");

const normalizeUploadPath = (value) => {
    if (typeof value !== "string") return value;
    const index = value.indexOf("/uploads/");
    if (index === -1) return value;
    return value.slice(index);
};

const normalizeUploadsDeep = (input) => {
    if (Array.isArray(input)) {
        return input.map((item) => normalizeUploadsDeep(item));
    }
    if (input && typeof input === "object") {
        return Object.fromEntries(
            Object.entries(input).map(([key, value]) => [
                key,
                normalizeUploadsDeep(value),
            ])
        );
    }
    return normalizeUploadPath(input);
};

const getOAuthRedirectUrl = (provider, backendUrl) => {
    if (provider === "google") {
        return (
            process.env.GOOGLE_CALLBACK_URL ||
            `${backendUrl}/api/auth/google/callback`
        );
    }
    if (provider === "line") {
        return (
            process.env.LINE_CALLBACK_URL || `${backendUrl}/api/auth/line/callback`
        );
    }
    return "";
};

const resolveAdminRedirect = (params, adminUrl) => {
    const target = adminUrl || "http://localhost:4021";
    const query = new URLSearchParams(params);
    return `${target}/login?${query.toString()}`;
};

module.exports = {
    isProduction,
    normalizeBaseUrl,
    resolveBaseUrl,
    nowDate,
    formatDate,
    retentionDate,
    slugify,
    normalizeUploadPath,
    normalizeUploadsDeep,
    getOAuthRedirectUrl,
    resolveAdminRedirect,
};
