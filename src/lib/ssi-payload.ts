export type SsiDiveType = 0 | 2 | 4 | 6 | 8;

/**
 * Fields confirmed in real MySSI QR payloads (community reverse-engineering
 * + user-exported SSI app QRs). Order matches SSI-app-generated samples.
 */
export type SsiPayloadInput = {
  diveType?: SsiDiveType;
  /** Dive duration in minutes (one decimal preferred). */
  diveTimeMin: number;
  /** UTC ISO datetime from UDDF; converted to local YYYYMMDDHHmm. */
  startTimeUtc: string;
  maxDepthM: number;
  siteId?: string | number | null;
  waterTypeId?: number | null;
  /** SSI activity type, e.g. 24 = Fun dive. */
  diveTypeId?: number | null;
  /**
   * SSI app often emits `var_divetype_id` twice in its own QR export.
   * Default true when diveTypeId is set, to match working imports.
   */
  duplicateDiveTypeId?: boolean;
  userMasterId?: string | number | null;
  userFirstName?: string | null;
  userLastName?: string | null;
  /** Include empty user_leader_id: when user fields are present. Default true. */
  includeEmptyLeaderId?: boolean;
  /** Water temperature (°C) — typically the lower/main reading. */
  waterTempC?: number | null;
  /** Max water temperature (°C), observed in real SSI QR exports. */
  waterTempMaxC?: number | null;
  /** Visibility in meters (manual SSI field; usually absent from UDDF). */
  visM?: number | null;
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Format a Date as SSI `YYYYMMDDHHmm` using the runtime's local timezone.
 */
export function formatSsiDatetime(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}${m}${day}${h}${min}`;
}

/**
 * Convert a UTC ISO timestamp to SSI `YYYYMMDDHHmm` in the browser's local timezone.
 */
export function toSsiDatetimeLocal(isoUtc: string): string {
  return formatSsiDatetime(new Date(isoUtc));
}

function formatOneDecimal(n: number): string {
  return round1(n).toFixed(1);
}

function hasValue(value: string | number | null | undefined): value is string | number {
  if (value == null) return false;
  if (typeof value === "string") return value.trim() !== "";
  return true;
}

/**
 * Build an SSI MySSI QR payload string.
 * Field order mirrors real SSI-app exports such as:
 * dive;noid;dive_type:0;divetime:…;datetime:…;depth_m:…;site:…;
 * var_watertype_id:…;var_divetype_id:…;var_divetype_id:…;user_…;user_leader_id:;
 * watertemp_c:…;vis_m:…;watertemp_max_c:…
 */
export function buildSsiPayload(input: SsiPayloadInput): string {
  const diveType = input.diveType ?? 0;
  const parts: string[] = [
    "dive",
    "noid",
    `dive_type:${diveType}`,
    `divetime:${formatOneDecimal(input.diveTimeMin)}`,
    `datetime:${toSsiDatetimeLocal(input.startTimeUtc)}`,
    `depth_m:${formatOneDecimal(input.maxDepthM)}`,
  ];

  if (hasValue(input.siteId)) {
    parts.push(`site:${String(input.siteId).trim()}`);
  }

  if (input.waterTypeId != null) {
    parts.push(`var_watertype_id:${input.waterTypeId}`);
  }

  if (input.diveTypeId != null) {
    parts.push(`var_divetype_id:${input.diveTypeId}`);
    if (input.duplicateDiveTypeId !== false) {
      parts.push(`var_divetype_id:${input.diveTypeId}`);
    }
  }

  const hasUser =
    hasValue(input.userMasterId) ||
    hasValue(input.userFirstName) ||
    hasValue(input.userLastName);

  if (hasValue(input.userMasterId)) {
    parts.push(`user_master_id:${String(input.userMasterId).trim()}`);
  }
  if (hasValue(input.userFirstName)) {
    parts.push(`user_firstname:${String(input.userFirstName).trim()}`);
  }
  if (hasValue(input.userLastName)) {
    parts.push(`user_lastname:${String(input.userLastName).trim()}`);
  }

  if (hasUser && input.includeEmptyLeaderId !== false) {
    parts.push("user_leader_id:");
  }

  if (input.waterTempC != null && Number.isFinite(input.waterTempC)) {
    parts.push(`watertemp_c:${formatOneDecimal(input.waterTempC)}`);
  }

  if (input.visM != null && Number.isFinite(input.visM)) {
    parts.push(`vis_m:${formatOneDecimal(input.visM)}`);
  }

  if (input.waterTempMaxC != null && Number.isFinite(input.waterTempMaxC)) {
    parts.push(`watertemp_max_c:${formatOneDecimal(input.waterTempMaxC)}`);
  }

  return parts.join(";");
}

export type SsiPayloadField = {
  key: string;
  value: string;
};

export type SsiPayloadDisplayRow = {
  label: string;
  value: string;
  key: string;
};

const FIELD_LABELS: Record<string, string> = {
  dive_type: "Dive mode",
  divetime: "Dive time",
  datetime: "Date & time",
  depth_m: "Max depth",
  site: "Dive site",
  var_watertype_id: "Water type",
  var_divetype_id: "Dive type",
  var_weather_id: "Weather",
  var_entry_id: "Entry",
  var_water_body_id: "Water body",
  var_current_id: "Current",
  var_surface_id: "Surface",
  user_master_id: "SSI user ID",
  user_firstname: "First name",
  user_lastname: "Last name",
  user_leader_id: "Leader ID",
  watertemp_c: "Water temp",
  watertemp_max_c: "Max water temp",
  vis_m: "Visibility",
  airtemp_c: "Air temp",
};

const DIVE_MODE_LABELS: Record<string, string> = {
  "0": "Scuba",
  "2": "Extended range",
  "4": "Rebreather (SC)",
  "6": "Freediving",
  "8": "CCR",
};

const WATER_TYPE_LABELS: Record<string, string> = {
  "4": "Fresh",
  "5": "Salt",
};

const DIVE_TYPE_LABELS: Record<string, string> = {
  "23": "Education",
  "24": "Fun dive",
  "138": "Scientific",
  "139": "Work",
};

/**
 * Parse a built SSI payload into ordered key/value rows (skips dive/noid markers).
 */
export function parseSsiPayloadFields(payload: string): SsiPayloadField[] {
  const fields: SsiPayloadField[] = [];
  for (const part of payload.split(";")) {
    if (!part || part === "dive" || part === "noid") continue;
    const colon = part.indexOf(":");
    if (colon === -1) {
      fields.push({ key: part, value: "" });
      continue;
    }
    fields.push({
      key: part.slice(0, colon),
      value: part.slice(colon + 1),
    });
  }
  return fields;
}

function formatSsiDatetimeDisplay(raw: string): string {
  if (!/^\d{12}$/.test(raw)) return raw;
  const y = raw.slice(0, 4);
  const m = raw.slice(4, 6);
  const d = raw.slice(6, 8);
  const h = raw.slice(8, 10);
  const min = raw.slice(10, 12);
  return `${d}.${m}.${y}, ${h}:${min}`;
}

function formatFieldValue(key: string, value: string): string {
  if (value === "") return "—";

  switch (key) {
    case "dive_type":
      return DIVE_MODE_LABELS[value] ?? value;
    case "divetime":
      return `${value} min`;
    case "datetime":
      return formatSsiDatetimeDisplay(value);
    case "depth_m":
      return `${value} m`;
    case "var_watertype_id":
      return WATER_TYPE_LABELS[value] ?? value;
    case "var_divetype_id":
      return DIVE_TYPE_LABELS[value] ?? value;
    case "watertemp_c":
    case "watertemp_max_c":
    case "airtemp_c":
      return `${value} °C`;
    case "vis_m":
      return `${value} m`;
    default:
      return value;
  }
}

/**
 * UI-only friendly rows derived from a QR payload. Does not change the QR string.
 * Duplicate keys (e.g. SSI's repeated var_divetype_id) are shown once.
 */
export function toSsiPayloadDisplayRows(payload: string): SsiPayloadDisplayRow[] {
  const seen = new Set<string>();
  const rows: SsiPayloadDisplayRow[] = [];

  for (const field of parseSsiPayloadFields(payload)) {
    if (seen.has(field.key)) continue;
    seen.add(field.key);
    rows.push({
      key: field.key,
      label: FIELD_LABELS[field.key] ?? field.key.replaceAll("_", " "),
      value: formatFieldValue(field.key, field.value),
    });
  }

  return rows;
}

