"use client";

import React, { useEffect, useState } from "react";
import { EnrichedEvent, Severity } from "@/lib/events";
import { EvaluatedAI } from "@/lib/aiSentinel";
import "leaflet/dist/leaflet.css";

declare const L: any;

interface EventsResponse {
  updatedAt: string;
  events: EnrichedEvent[];
}
interface AIResponse {
  updatedAt: string;
  models: EvaluatedAI[];
}

export default function Page() {
  const [events, setEvents] = useState<EnrichedEvent[]>([]);
  const [aiModels, setAiModels] = useState<EvaluatedAI[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>("--:--:--");
  const [countdown, setCountdown] = useState(20);

  useEffect(() => {
    let map: any;
    let markers: any[] = [];

    async function fetchAll() {
      const [evRes, aiRes] = await Promise.all([
        fetch("/api/events").then((r) => r.json() as Promise<EventsResponse>),
        fetch("/api/ai").then((r) => r.json() as Promise<AIResponse>),
      ]);
      setEvents(evRes.events);
      setAiModels(aiRes.models);
      setLastUpdate(new Date(evRes.updatedAt).toLocaleTimeString("en-GB", { hour12: false }));

      // Map init
      if (!map) {
        map = L.map("map", { center: [20, 0], zoom: 2, minZoom: 2 });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
        }).addTo(map);
      }
      markers.forEach((m) => map.removeLayer(m));
      markers = [];
      evRes.events.forEach((e) => {
        const color = colorForDomain(e.domain);
        const m = L.circleMarker([e.lat, e.lon], {
          radius: 7,
          fillColor: color,
          color,
          weight: 1,
          fillOpacity: 0.7,
        }).bindPopup(
          `<strong>${e.country || ""} ${e.city || ""}</strong><br/>${e.domain.toUpperCase()}<br/>${e.finalSeverity.toUpperCase()}`
        );
        m.addTo(map);
        markers.push(m);
      });
    }

    fetchAll();
    const interval = setInterval(fetchAll, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((c) => (c <= 1 ? 20 : c - 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const sevCount = (sev: Severity) =>
    events.filter((e) => e.finalSeverity === sev).length;

  return (
    <main style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>BTG AEGIS AI · Global Command Center</div>
        <div style={{ fontSize: 11 }}>
          Next refresh in <strong>{countdown}s</strong> · Last update {lastUpdate}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <Metric label="Tracked Events" value={events.length} />
        <Metric label="Critical / High" value={`${sevCount("critical")} / ${sevCount("high")}`} />
        <Metric label="Medium / Low" value={`${sevCount("medium")} / ${sevCount("low")}`} />
        <Metric label="AI Models" value={aiModels.length} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr", gap: 14 }}>
        <div style={{ background: "#111827", borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 12, color: "#22d3ee", marginBottom: 6 }}>Global Threat Map</div>
          <div id="map" style={{ height: 340, borderRadius: 8 }} />
        </div>
        <div style={{ background: "#111827", borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 12, color: "#22d3ee", marginBottom: 6 }}>Latest Events</div>
          <div style={{ maxHeight: 320, overflowY: "auto", fontSize: 11 }}>
            {events.map((e) => (
              <EventRow key={e.id} e={e} />
            ))}
            {events.length === 0 && <div style={{ color: "#9ca3af" }}>No events (seed or connect backend).</div>}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, background: "#111827", borderRadius: 10, padding: 10 }}>
        <div style={{ fontSize: 12, color: "#22d3ee", marginBottom: 6 }}>AI Sentinel Decisions</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 11 }}>
          {aiModels.map((m) => (
            <AIRow key={m.id} m={m} />
          ))}
          {aiModels.length === 0 && <div style={{ color: "#9ca3af" }}>No AI stats yet.</div>}
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: "#020617", borderRadius: 10, padding: 10, fontSize: 11 }}>
      <div style={{ color: "#9ca3af" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function EventRow({ e }: { e: EnrichedEvent }) {
  return (
    <div style={{ marginBottom: 6, padding: 6, borderRadius: 6, background: "#020617" }}>
      <div>
        <span style={sevStyle(e.finalSeverity)}>{e.finalSeverity.toUpperCase()}</span>{" "}
        <span style={{ fontSize: 10, color: "#38bdf8" }}>{e.domain.toUpperCase()}</span>{" "}
        <strong>
          {e.country} {e.city}
        </strong>
      </div>
      <div style={{ color: "#9ca3af" }}>{e.description}</div>
      <div style={{ color: "#6b7280" }}>
        SevScore {e.sevScore.toFixed(2)} · ImpactIdx {e.impactIndex.toFixed(0)}
      </div>
    </div>
  );
}

function AIRow({ m }: { m: EvaluatedAI }) {
  const color =
    m.decision === "STOP"
      ? "#ef4444"
      : m.decision === "REVIEW"
      ? "#f97316"
      : m.decision === "MONITOR"
      ? "#eab308"
      : "#22c55e";
  return (
    <div style={{ padding: 6, borderRadius: 6, background: "#020617" }}>
      <div>
        <span style={{ fontSize: 10, color: "#38bdf8", marginRight: 6 }}>{m.id}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color }}>{m.decision}</span>
      </div>
      <div style={{ color: "#9ca3af" }}>Score {m.ethicalScore.toFixed(2)} · Domain {m.domain}</div>
    </div>
  );
}

function sevStyle(sev: Severity): React.CSSProperties {
  const base: React.CSSProperties = {
    fontSize: 10,
    padding: "1px 6px",
    borderRadius: 999,
    marginRight: 4,
  };
  if (sev === "critical") return { ...base, background: "rgba(239,68,68,.18)", color: "#fca5a5" };
  if (sev === "high") return { ...base, background: "rgba(249,115,22,.18)", color: "#fed7aa" };
  if (sev === "medium") return { ...base, background: "rgba(234,179,8,.18)", color: "#facc15" };
  return { ...base, background: "rgba(34,197,94,.18)", color: "#bbf7d0" };
}

function colorForDomain(d: string): string {
  switch (d) {
    case "cyber":
      return "#3b82f6";
    case "disaster":
      return "#eab308";
    case "conflict":
    case "war":
      return "#ef4444";
    case "violence":
      return "#f97316";
    case "protest":
      return "#22c55e";
    case "economic":
      return "#a855f7";
    case "political":
      return "#22d3ee";
    case "deepfake":
      return "#f97316";
    case "supply_chain":
      return "#0ea5e9";
    default:
      return "#64748b";
  }
            }
