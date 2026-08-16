import { XMLParser } from "fast-xml-parser";
import type { SsiDiveType } from "./ssi-payload";

export type ParsedDive = {
  id: string;
  diveNumber: number | null;
  startTimeUtc: string;
  durationSeconds: number;
  durationMinutes: number;
  maxDepthM: number;
  /** Lowest water temperature from profile waypoints (°C). */
  waterTempMinC: number | null;
  /** Highest water temperature from profile waypoints (°C). */
  waterTempMaxC: number | null;
  /** SSI dive_type inferred from UDDF dive mode, when known. */
  diveType: SsiDiveType | null;
  /** SSI var_watertype_id inferred from water density, when known. */
  waterTypeId: number | null;
};

export type ParseUddfResult = {
  dives: ParsedDive[];
  generatorName: string | null;
};

const UDDF_NS = "http://www.streit.cc/uddf/3.2/";

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function textValue(node: unknown): string | null {
  if (node == null) return null;
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (typeof node === "object" && node !== null && "#text" in node) {
    const text = (node as { "#text"?: unknown })["#text"];
    return text == null ? null : String(text);
  }
  return null;
}

function numValue(node: unknown): number | null {
  const text = textValue(node);
  if (text == null || text.trim() === "") return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

function attr(node: unknown, name: string): string | null {
  if (node == null || typeof node !== "object") return null;
  const record = node as Record<string, unknown>;
  const direct = record[`@_${name}`];
  if (direct != null) return String(direct);
  const nested = record[`:@`] as Record<string, unknown> | undefined;
  const value = nested?.[`@_${name}`];
  return value == null ? null : String(value);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function kelvinToCelsius(k: number): number {
  return round1(k - 273.15);
}

function waterTempRangeC(dive: Record<string, unknown>): {
  minC: number | null;
  maxC: number | null;
} {
  const samples = dive.samples as Record<string, unknown> | undefined;
  if (!samples) return { minC: null, maxC: null };

  let minK: number | null = null;
  let maxK: number | null = null;
  for (const waypoint of asArray(samples.waypoint)) {
    if (!waypoint || typeof waypoint !== "object") continue;
    const k = numValue((waypoint as Record<string, unknown>).temperature);
    if (k == null) continue;
    if (minK == null || k < minK) minK = k;
    if (maxK == null || k > maxK) maxK = k;
  }

  return {
    minC: minK == null ? null : kelvinToCelsius(minK),
    maxC: maxK == null ? null : kelvinToCelsius(maxK),
  };
}

/** Map UDDF density (kg/m³) to SSI var_watertype_id: 4 fresh, 5 salt. */
export function densityToWaterTypeId(density: number): number | null {
  if (!Number.isFinite(density)) return null;
  if (density >= 1015) return 5; // seawater ~1020
  if (density <= 1005) return 4; // freshwater ~1000
  return null;
}

/** Map UDDF dive mode to SSI dive_type. */
export function diveModeToSsiDiveType(mode: string | null): SsiDiveType | null {
  if (!mode) return null;
  switch (mode.toLowerCase()) {
    case "opencircuit":
      return 0;
    case "closedcircuit":
      return 8;
    case "semiclosedcircuit":
      return 4;
    case "apnea":
    case "freedive":
    case "freediving":
      return 6;
    default:
      return null;
  }
}

function firstDiveMode(dive: Record<string, unknown>): string | null {
  const samples = dive.samples as Record<string, unknown> | undefined;
  if (!samples) return null;
  for (const waypoint of asArray(samples.waypoint)) {
    if (!waypoint || typeof waypoint !== "object") continue;
    const modeNode = (waypoint as Record<string, unknown>).divemode;
    const type = attr(modeNode, "type");
    if (type) return type;
  }
  return null;
}

function profileRefs(before: Record<string, unknown>): string[] {
  const refs: string[] = [];
  for (const link of asArray(before.link)) {
    const ref = attr(link, "ref");
    if (ref) refs.push(ref);
  }
  return refs;
}

function collectProfileDensities(root: Record<string, unknown>): Map<string, number> {
  const map = new Map<string, number>();
  const table = root.tablegeneration as Record<string, unknown> | undefined;
  if (!table) return map;

  const calc = table.calculateprofile as Record<string, unknown> | undefined;
  if (!calc) return map;

  for (const profile of asArray(calc.profile)) {
    if (!profile || typeof profile !== "object") continue;
    const id = attr(profile, "id");
    const density = numValue((profile as Record<string, unknown>).density);
    if (id && density != null) map.set(id, density);
  }
  return map;
}

function resolveWaterTypeId(
  before: Record<string, unknown>,
  densities: Map<string, number>,
): number | null {
  for (const ref of profileRefs(before)) {
    const density = densities.get(ref);
    if (density != null) {
      const waterType = densityToWaterTypeId(density);
      if (waterType != null) return waterType;
    }
  }

  // Single-profile fallback when link refs are missing/odd
  if (densities.size === 1) {
    const only = densities.values().next().value as number;
    return densityToWaterTypeId(only);
  }
  return null;
}

function unwrapRoot(parsed: Record<string, unknown>): Record<string, unknown> {
  if (parsed.uddf && typeof parsed.uddf === "object") {
    return parsed.uddf as Record<string, unknown>;
  }

  const key = Object.keys(parsed).find((k) => k === "uddf" || k.endsWith(":uddf"));
  if (key && typeof parsed[key] === "object") {
    return parsed[key] as Record<string, unknown>;
  }

  return parsed;
}

function parseDive(
  dive: Record<string, unknown>,
  densities: Map<string, number>,
): ParsedDive | null {
  const before = dive.informationbeforedive as Record<string, unknown> | undefined;
  const after = dive.informationafterdive as Record<string, unknown> | undefined;
  if (!before || !after) return null;

  const startTimeUtc = textValue(before.datetime);
  const durationSeconds = numValue(after.diveduration);
  const maxDepthM = numValue(after.greatestdepth);
  if (!startTimeUtc || durationSeconds == null || maxDepthM == null) {
    return null;
  }

  const id = attr(dive, "id") ?? startTimeUtc;
  const diveNumber = numValue(before.divenumber);
  const temps = waterTempRangeC(dive);

  return {
    id,
    diveNumber,
    startTimeUtc,
    durationSeconds,
    durationMinutes: round1(durationSeconds / 60),
    maxDepthM: round1(maxDepthM),
    waterTempMinC: temps.minC,
    waterTempMaxC: temps.maxC,
    diveType: diveModeToSsiDiveType(firstDiveMode(dive)),
    waterTypeId: resolveWaterTypeId(before, densities),
  };
}

/**
 * Parse a Shearwater (or other) UDDF 3.2 XML string into dive summaries.
 * Safe to run in the browser — no network, no filesystem.
 */
export function parseUddf(xml: string): ParseUddfResult {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: true,
    isArray: (name) =>
      name === "dive" ||
      name === "repetitiongroup" ||
      name === "waypoint" ||
      name === "tankdata" ||
      name === "link" ||
      name === "profile",
  });

  const parsed = parser.parse(xml) as Record<string, unknown>;
  const root = unwrapRoot(parsed);

  const xmlns = textValue(root["@_xmlns"]) ?? attr(root, "xmlns");
  if (xmlns && xmlns !== UDDF_NS && !xmlns.includes("/uddf/")) {
    // Still attempt parse — some exporters omit or vary xmlns
  }

  const generator = root.generator as Record<string, unknown> | undefined;
  const generatorName = generator ? textValue(generator.name) : null;
  const densities = collectProfileDensities(root);

  const profiledata = root.profiledata as Record<string, unknown> | undefined;
  const dives: ParsedDive[] = [];

  if (profiledata) {
    for (const group of asArray(profiledata.repetitiongroup)) {
      if (!group || typeof group !== "object") continue;
      for (const dive of asArray((group as Record<string, unknown>).dive)) {
        if (!dive || typeof dive !== "object") continue;
        const parsedDive = parseDive(dive as Record<string, unknown>, densities);
        if (parsedDive) dives.push(parsedDive);
      }
    }
  }

  return { dives, generatorName };
}
