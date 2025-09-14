export type CrashBreadcrumb = {
  ts?: string;              // ISO
  type?: string;            // "log" | "nav" | "net" | ...
  message?: string;
  meta?: Record<string, any>;
};

export type CrashReport = {
  report_id?: string;       // UUID/ULID from client
  device_id?: string;       // hashed install id
  user_id?: string;         // hashed, optional
  platform: "android" | "ios";
  app_version: string;
  os_version?: string;
  model?: string;
  is_fatal: boolean;
  thread?: string;
  exception_type?: string;
  exception_message?: string;
  stacktrace: string;
  breadcrumbs?: CrashBreadcrumb[];
  battery?: number;         // 0-100
  memory_free_mb?: number;
  network?: "wifi" | "cell" | "offline";
  locale?: string;          // "th-TH"
  area_code?: string;       // ADM2/geohash5 (no precise GPS)
  occurred_at: string;      // ISO
  extra?: Record<string, any>;
};
