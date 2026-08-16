"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import QRCode from "qrcode";
import type { ParsedDive } from "@/lib/uddf";
import { parseUddf } from "@/lib/uddf";
import { buildSsiPayload, toSsiPayloadDisplayRows } from "@/lib/ssi-payload";

export default function DiveQrTool() {
  const [dives, setDives] = useState<ParsedDive[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const selectedDive = useMemo(
    () => dives.find((d) => d.id === selectedId) ?? null,
    [dives, selectedId],
  );

  const payload = useMemo(() => {
    if (!selectedDive) return null;
    return buildSsiPayload({
      diveType: selectedDive.diveType ?? 0,
      diveTimeMin: selectedDive.durationMinutes,
      startTimeUtc: selectedDive.startTimeUtc,
      maxDepthM: selectedDive.maxDepthM,
      waterTypeId: selectedDive.waterTypeId,
      waterTempC: selectedDive.waterTempMinC,
      waterTempMaxC: selectedDive.waterTempMaxC,
    });
  }, [selectedDive]);

  const payloadFields = useMemo(
    () => (payload ? toSsiPayloadDisplayRows(payload) : []),
    [payload],
  );

  useEffect(() => {
    let cancelled = false;
    async function renderQr() {
      if (!payload) {
        setQrDataUrl(null);
        return;
      }
      try {
        const url = await QRCode.toDataURL(payload, {
          errorCorrectionLevel: "M",
          margin: 2,
          width: 420,
          color: { dark: "#0a0a0a", light: "#ffffff" },
        });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        if (!cancelled) setQrDataUrl(null);
      }
    }
    void renderQr();
    return () => {
      cancelled = true;
    };
  }, [payload]);

  async function handleFile(file: File) {
    setError(null);
    try {
      const text = await file.text();
      const result = parseUddf(text);
      if (result.dives.length === 0) {
        setDives([]);
        setSelectedId(null);
        setError("No dives found in this UDDF file.");
        return;
      }
      setDives(result.dives);
      setSelectedId(result.dives[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse UDDF");
      setDives([]);
      setSelectedId(null);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  const hasDive = Boolean(selectedDive && qrDataUrl);

  return (
    <div>
      {!hasDive ? (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center transition ${
            dragging
              ? "border-[var(--red)] bg-[var(--red)]/10"
              : "border-white/20 hover:border-[var(--red)]/60"
          }`}
        >
          <span className="text-base font-medium text-white">Import UDDF file</span>
          <span className="mt-2 text-sm text-[var(--muted)]">
            Choose a Shearwater or other UDDF export, or drop it here
          </span>
          <input
            type="file"
            accept=".uddf,application/xml,text/xml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </label>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-xl border border-[var(--red)]/50 bg-[var(--red)]/10 px-4 py-3 text-center text-sm text-white">
          {error}
        </p>
      ) : null}

      {hasDive && selectedDive ? (
        <section
          aria-label="Generated SSI QR code"
          className="flex flex-1 flex-col items-center animate-[fadeUp_0.4s_ease-out]"
        >
          {dives.length > 1 ? (
            <div className="mb-5 flex max-w-full gap-2 overflow-x-auto pb-1">
              {dives.map((dive) => {
                const active = dive.id === selectedId;
                return (
                  <button
                    key={dive.id}
                    type="button"
                    onClick={() => setSelectedId(dive.id)}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm transition ${
                      active
                        ? "bg-[var(--red)] text-white"
                        : "bg-white/10 text-[var(--muted)] hover:text-white"
                    }`}
                  >
                    {dive.diveNumber != null ? `Dive ${dive.diveNumber}` : "Dive"}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="rounded-2xl border border-[var(--red)] bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl!}
              alt="MySSI-compatible dive log QR code ready to scan"
              width={420}
              height={420}
              className="block size-[min(70vw,320px)]"
            />
          </div>

          <div className="mt-8 w-full overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Dive details encoded in the SSI QR code
              </caption>
              <thead>
                <tr className="border-b border-white/10 text-[var(--muted)]">
                  <th scope="col" className="px-4 py-3 font-medium">
                    Detail
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {payloadFields.map((field) => (
                  <tr
                    key={field.key}
                    className="border-b border-white/5 last:border-b-0"
                  >
                    <th
                      scope="row"
                      className="px-4 py-2.5 text-left font-normal text-[var(--muted)]"
                    >
                      {field.label}
                    </th>
                    <td className="px-4 py-2.5 text-white">{field.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <label className="mt-8 cursor-pointer text-sm font-medium text-[var(--red)] underline-offset-4 hover:underline">
            Import another file
            <input
              type="file"
              accept=".uddf,application/xml,text/xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
          </label>
        </section>
      ) : null}
    </div>
  );
}
