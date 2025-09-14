import crypto from "crypto";
import semverCompare from "semver/functions/compare.js";
import { EvalContext, FlagRow, FlagRule } from "./types";

/** Stable bucket 0..9999 from user id (string). */
export function bucketOf(id: string): number {
  const h = crypto.createHash("sha1").update(id).digest();
  // take first 2 bytes → 0..65535 → map to 0..9999
  const n = (h[0] << 8) + h[1];
  return Math.floor((n / 65535) * 10000);
}

/** semver a >= b (weakly). If parsing fails, default true. */
function semverGte(a?: string, b?: string) {
  if (!a || !b) return true;
  try {
    return semverCompare(a, b) >= 0;
  } catch { return true; }
}

function matchesRule(ctx: EvalContext, rule: FlagRule): boolean {
  const m = rule.match || {};
  if (m.platform_in && ctx.platform && !m.platform_in.includes(ctx.platform)) return false;
  if (m.country_in && ctx.country && !m.country_in.includes(ctx.country)) return false;
  if (m.crop_in && ctx.crop && !m.crop_in.includes(ctx.crop)) return false;
  if (m.area_prefix && ctx.area_code && !ctx.area_code.startsWith(m.area_prefix)) return false;
  if (m.app_version_gte && !semverGte(ctx.app_version, m.app_version_gte)) return false;
  return true;
}

export function evaluateFlags(ctx: EvalContext, rows: FlagRow[], userOverrides?: Record<string, any>): Record<string, any> {
  const uid = ctx.user_id || ctx.anon_id || "anon";
  const buck = bucketOf(uid); // 0..9999
  const result: Record<string, any> = {};

  // Overrides first (QA/support)
  if (userOverrides) {
    for (const [k, v] of Object.entries(userOverrides)) result[k] = v;
  }

  for (const r of rows) {
    if (result[r.key] !== undefined) continue; // skip if overridden

    let value = safeParseJson(r.value_json);   // default
    const rules: FlagRule[] = r.rules_json ? (safeParseJson(r.rules_json) || []) : [];

    for (const rule of rules) {
      if (!matchesRule(ctx, rule)) continue;
      const pct = Math.max(0, Math.min(100, rule.rollout ?? 100));
      const thresh = Math.floor(pct * 100); // map to 0..10000
      if (buck < thresh) {
        value = rule.variant ?? value;
        break;
      }
    }
    result[r.key] = value;
  }
  return result;
}

function safeParseJson(s: string | null | undefined) {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}
