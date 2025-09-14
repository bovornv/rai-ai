import crypto from "crypto";
import { CrashReport } from "./types";

const MAX_STACK = 64 * 1024;   // 64KB
const MAX_BREADCRUMBS = 50;

export function clampText(s?: string, max=2048) {
  if (!s) return s;
  return s.length > max ? s.slice(0, max) : s;
}

export function sanitizeCrash(c: CrashReport): CrashReport {
  const copy = { ...c };

  // strip potential PII from extra/breadcrumbs (defensive)
  const stripKeys = ["phone", "email", "gps", "image", "jwt", "token"];
  const scrubObj = (obj: any) => {
    if (!obj || typeof obj !== "object") return;
    for (const k of stripKeys) if (k in obj) delete obj[k];
    for (const k in obj) if (obj[k] && typeof obj[k] === "object") scrubObj(obj[k]);
  };
  if (copy.extra) scrubObj(copy.extra);
  if (copy.breadcrumbs) copy.breadcrumbs.forEach(b => b.meta && scrubObj(b.meta));

  copy.exception_message = clampText(copy.exception_message, 1024);
  copy.thread = clampText(copy.thread, 128);
  copy.model = clampText(copy.model, 128);
  copy.os_version = clampText(copy.os_version, 64);
  copy.app_version = clampText(copy.app_version, 64);
  copy.locale = clampText(copy.locale, 32);
  copy.area_code = clampText(copy.area_code, 16);

  // trim stacktrace & breadcrumbs count/size
  copy.stacktrace = (copy.stacktrace || "").slice(0, MAX_STACK);
  if (copy.breadcrumbs && copy.breadcrumbs.length > MAX_BREADCRUMBS) {
    copy.breadcrumbs = copy.breadcrumbs.slice(-MAX_BREADCRUMBS);
  }

  return copy;
}

/** Build a stable hash for grouping crashes by top frames. */
export function hashStack(stacktrace: string): string {
  // Take first ~10 lines (frames) to reduce noise
  const top = stacktrace.split(/\r?\n/).slice(0, 10).join("\n");
  return crypto.createHash("sha1").update(top).digest("hex");
}
