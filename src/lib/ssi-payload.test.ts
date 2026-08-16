import { describe, expect, it } from "vitest";
import {
  buildSsiPayload,
  formatSsiDatetime,
  parseSsiPayloadFields,
  toSsiDatetimeLocal,
  toSsiPayloadDisplayRows,
} from "./ssi-payload";

describe("formatSsiDatetime", () => {
  it("formats local components as YYYYMMDDHHmm", () => {
    const d = new Date(2026, 7, 13, 18, 44, 0);
    expect(formatSsiDatetime(d)).toBe("202608131844");
  });
});

describe("buildSsiPayload", () => {
  it("builds a UDDF-only payload without personal SSI fields", () => {
    const startTimeUtc = "2026-07-26T08:10:00.000Z";
    const payload = buildSsiPayload({
      diveType: 0,
      diveTimeMin: 50,
      startTimeUtc,
      maxDepthM: 17.7,
      waterTypeId: 5,
      waterTempC: 28,
      waterTempMaxC: 29,
    });

    expect(payload).toBe(
      [
        "dive",
        "noid",
        "dive_type:0",
        "divetime:50.0",
        `datetime:${toSsiDatetimeLocal(startTimeUtc)}`,
        "depth_m:17.7",
        "var_watertype_id:5",
        "watertemp_c:28.0",
        "watertemp_max_c:29.0",
      ].join(";"),
    );
    expect(payload).not.toContain("site:");
    expect(payload).not.toContain("user_");
    expect(payload).not.toContain("var_divetype_id:");
  });

  it("omits optional fields when empty", () => {
    const payload = buildSsiPayload({
      diveTimeMin: 30,
      startTimeUtc: "2026-01-01T12:00:00Z",
      maxDepthM: 10,
    });
    expect(payload).toMatch(/^dive;noid;dive_type:0;divetime:30\.0;datetime:\d{12};depth_m:10\.0$/);
  });

  it("parses payload fields for the table view", () => {
    const fields = parseSsiPayloadFields(
      "dive;noid;dive_type:0;divetime:50.0;watertemp_c:28.0",
    );
    expect(fields).toEqual([
      { key: "dive_type", value: "0" },
      { key: "divetime", value: "50.0" },
      { key: "watertemp_c", value: "28.0" },
    ]);
  });

  it("formats friendly display rows without changing QR semantics", () => {
    const payload = [
      "dive",
      "noid",
      "dive_type:0",
      "divetime:50.0",
      "datetime:202607261010",
      "depth_m:17.7",
      "var_watertype_id:5",
      "watertemp_c:28.0",
    ].join(";");

    expect(toSsiPayloadDisplayRows(payload)).toEqual([
      { key: "dive_type", label: "Dive mode", value: "Scuba" },
      { key: "divetime", label: "Dive time", value: "50.0 min" },
      { key: "datetime", label: "Date & time", value: "26.07.2026, 10:10" },
      { key: "depth_m", label: "Max depth", value: "17.7 m" },
      { key: "var_watertype_id", label: "Water type", value: "Salt" },
      { key: "watertemp_c", label: "Water temp", value: "28.0 °C" },
    ]);
  });
});
