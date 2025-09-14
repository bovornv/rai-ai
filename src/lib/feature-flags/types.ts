export type Platform = "android" | "ios" | "web";
export type Crop = "rice" | "durian";

export type EvalContext = {
  user_id?: string;
  anon_id?: string;
  app_version?: string;     // "1.3.0"
  platform?: Platform;
  country?: "TH" | string;
  area_code?: string;       // ADM2, geohash5, etc.
  crop?: Crop;
};

export type FlagRule = {
  match?: {
    platform_in?: Platform[];
    country_in?: string[];
    area_prefix?: string;          // e.g., "TH-40" (Khon Kaen) or geohash5 prefix
    crop_in?: Crop[];
    app_version_gte?: string;      // semver-ish compare
  };
  rollout?: number;                 // 0..100 (percent of users)
  variant?: any;                    // JSON value when rule matches + bucket in rollout
};

export type FlagRow = {
  key: string;
  description?: string;
  enabled: 0 | 1;
  value_json: string;               // default variant (JSON string)
  rules_json?: string | null;       // rules (JSON string)
  updated_at: string;
};

export type FlagEvalResult = Record<string, any>;
