"use client";

type JsSignalsPayload = Record<string, unknown>;

type InitTrackingOptions = {
  backendUrl: string;
  collectJsSignals?: () => JsSignalsPayload;
};

type TrackInteractionOptions = {
  source: string;
  label?: string;
  targetHref?: string;
  endReason?: string;
  finalizeSession?: boolean;
};

const VISITOR_COOKIE_NAME = "visitor_id";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

let backendUrl = "";
let collectSignals: (() => JsSignalsPayload) | null = null;
let initialized = false;
let finalized = false;
let sessionStartedAtMs = 0;
let visitorId = "";
let sessionId = "";

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

const getCookieValue = (name: string) => {
  const cookie = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`));
  if (!cookie) return "";
  return decodeURIComponent(cookie.slice(name.length + 1));
};

const setCookieValue = (name: string, value: string) => {
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
};

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const ensureVisitorId = () => {
  const fromCookie = getCookieValue(VISITOR_COOKIE_NAME);
  if (fromCookie) return fromCookie;
  const generated = `visitor_${createId()}`;
  setCookieValue(VISITOR_COOKIE_NAME, generated);
  return generated;
};

const getDurationMs = (nowMs: number) => Math.max(0, nowMs - sessionStartedAtMs);

const postTrackingPayload = (payload: Record<string, unknown>) => {
  if (!backendUrl) return;
  const serialized = JSON.stringify(payload);
  const endpoint = `${backendUrl}/stats/messenger-click`;

  if (navigator.sendBeacon) {
    const blob = new Blob([serialized], { type: "application/json" });
    navigator.sendBeacon(endpoint, blob);
    return;
  }

  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: serialized,
    keepalive: true,
  }).catch(() => {});
};

const sendTrackingEvent = ({
  eventType,
  source,
  label,
  targetHref,
  endReason,
  finalizeSession,
}: {
  eventType: "click" | "session-end";
  source: string;
  label?: string;
  targetHref?: string;
  endReason?: string;
  finalizeSession?: boolean;
}) => {
  if (!initialized || finalized || !backendUrl || !source) return;

  if (finalizeSession) {
    finalized = true;
  }

  const nowMs = Date.now();
  postTrackingPayload({
    eventType,
    source,
    label: label || "",
    targetHref: targetHref || "",
    referrer: window.location.href,
    visitorId,
    sessionId,
    durationMs: getDurationMs(nowMs),
    sessionStartedAt: new Date(sessionStartedAtMs).toISOString(),
    sessionEndedAt: new Date(nowMs).toISOString(),
    endReason: endReason || "",
    jsSignals: collectSignals ? collectSignals() : {},
  });
};

const handlePageHide = () => {
  finalizeTrackingSession("pagehide");
};

const handleBeforeUnload = () => {
  finalizeTrackingSession("beforeunload");
};

export const initUserTracking = ({ backendUrl: rawBackendUrl, collectJsSignals }: InitTrackingOptions) => {
  if (typeof window === "undefined") return;

  backendUrl = normalizeBaseUrl(rawBackendUrl || "");
  if (!backendUrl) return;

  if (collectJsSignals) {
    collectSignals = collectJsSignals;
  }

  if (initialized) return;

  initialized = true;
  finalized = false;
  sessionStartedAtMs = Date.now();
  visitorId = ensureVisitorId();
  sessionId = `session_${createId()}`;

  window.addEventListener("pagehide", handlePageHide);
  window.addEventListener("beforeunload", handleBeforeUnload);
};

export const isExitTargetHref = (href: string) => {
  const normalized = String(href || "").trim().toLowerCase();
  if (!normalized) return false;
  return (
    normalized.startsWith("tel:") ||
    normalized.includes("line.me") ||
    normalized.includes("lin.ee") ||
    normalized.includes("m.me/") ||
    normalized.includes("messenger.com")
  );
};

export const inferTrackingSourceFromHref = (href: string) => {
  const normalized = String(href || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized.startsWith("tel:")) return "phone-link";
  if (normalized.includes("line.me") || normalized.includes("lin.ee")) return "line-link";
  if (normalized.includes("m.me/") || normalized.includes("messenger.com")) {
    return "messenger-link";
  }
  return "";
};

export const trackUserInteraction = ({
  source,
  label,
  targetHref,
  endReason,
  finalizeSession = false,
}: TrackInteractionOptions) => {
  sendTrackingEvent({
    eventType: "click",
    source,
    label,
    targetHref,
    endReason,
    finalizeSession,
  });
};

export const finalizeTrackingSession = (reason: string) => {
  sendTrackingEvent({
    eventType: "session-end",
    source: "session-exit",
    label: reason,
    endReason: reason,
    finalizeSession: true,
  });
};

