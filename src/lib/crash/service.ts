import { Database } from "sqlite";
import { CrashReport } from "./types";
import { sanitizeCrash, hashStack } from "./sanitize";

export async function insertCrash(db: Database, raw: CrashReport) {
  const c = sanitizeCrash(raw);
  const now = new Date().toISOString();

  const stackHash = hashStack(c.stacktrace || "");

  const res = await db.run(
    `INSERT INTO crash_reports
     (report_id,device_id,user_id,platform,app_version,os_version,model,is_fatal,thread,
      exception_type,exception_message,stack_hash,stacktrace,breadcrumbs,battery,memory_free_mb,
      network,locale,area_code,occurred_at,received_at,extra)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    c.report_id ?? null,
    c.device_id ?? null,
    c.user_id ?? null,
    c.platform,
    c.app_version,
    c.os_version ?? null,
    c.model ?? null,
    c.is_fatal ? 1 : 0,
    c.thread ?? null,
    c.exception_type ?? null,
    c.exception_message ?? null,
    stackHash,
    c.stacktrace,
    c.breadcrumbs ? JSON.stringify(c.breadcrumbs) : null,
    Number.isFinite(c.battery ?? NaN) ? c.battery : null,
    Number.isFinite(c.memory_free_mb ?? NaN) ? c.memory_free_mb : null,
    c.network ?? null,
    c.locale ?? null,
    c.area_code ?? null,
    new Date(c.occurred_at).toISOString(),
    now,
    c.extra ? JSON.stringify(c.extra) : null
  );

  return { id: res.lastID, stack_hash: stackHash };
}
