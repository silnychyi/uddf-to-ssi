import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { parseUddf } from "./uddf";

const fixturePath = path.resolve(process.cwd(), "fixtures/sample.uddf");

describe("parseUddf", () => {
  it("parses the Shearwater Peregrine sample dive", () => {
    const xml = readFileSync(fixturePath, "utf-8");
    const result = parseUddf(xml);

    expect(result.generatorName).toBe("Shearwater Cloud Desktop");
    expect(result.dives).toHaveLength(1);

    const dive = result.dives[0];
    expect(dive.startTimeUtc).toBe("2026-08-10T14:26:56Z");
    expect(dive.diveNumber).toBe(11);
    expect(dive.durationSeconds).toBe(2491);
    expect(dive.durationMinutes).toBe(41.5);
    expect(dive.maxDepthM).toBe(6.6);
    expect(dive.waterTempMinC).not.toBeNull();
    expect(dive.waterTempMaxC).not.toBeNull();
    // 301.15 K ≈ 28.0 °C in sample waypoints
    expect(dive.waterTempMinC).toBe(28.0);
    expect(dive.waterTempMaxC).toBe(28.0);
    expect(dive.diveType).toBe(0);
    expect(dive.waterTypeId).toBe(5);
  });

  it("supports multi-dive files", () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<uddf xmlns="http://www.streit.cc/uddf/3.2/" version="3.2.3">
  <generator><name>Test</name></generator>
  <profiledata>
    <repetitiongroup>
      <dive id="a">
        <informationbeforedive>
          <divenumber>1</divenumber>
          <datetime>2026-01-01T10:00:00Z</datetime>
        </informationbeforedive>
        <informationafterdive>
          <greatestdepth>12.3</greatestdepth>
          <diveduration>1800</diveduration>
        </informationafterdive>
      </dive>
      <dive id="b">
        <informationbeforedive>
          <divenumber>2</divenumber>
          <datetime>2026-01-01T14:00:00Z</datetime>
        </informationbeforedive>
        <informationafterdive>
          <greatestdepth>20</greatestdepth>
          <diveduration>3600</diveduration>
        </informationafterdive>
      </dive>
    </repetitiongroup>
  </profiledata>
</uddf>`;

    const result = parseUddf(xml);
    expect(result.dives).toHaveLength(2);
    expect(result.dives[0].durationMinutes).toBe(30.0);
    expect(result.dives[1].maxDepthM).toBe(20.0);
  });
});
