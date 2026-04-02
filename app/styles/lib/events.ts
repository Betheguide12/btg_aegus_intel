export type EventDomain =
  | "cyber"
  | "disaster"
  | "political"
  | "economic"
  | "deepfake"
  | "supply_chain"
  | "violence"
  | "protest"
  | "conflict"
  | "war";

export type Severity = "low" | "medium" | "high" | "critical";

export interface RawEvent {
  id: string;
  ts: string;
  lat: number;
  lon: number;
  country?: string;
  city?: string;
  region?: string;
  domain: EventDomain;
  subType?: string;
  description?: string;
  metrics: {
    magnitude?: number;
    speed?: number;
    spread?: number;
    casualties?: number;
    infraLoss?: number;
  };
  severity?: Severity;
  confidence?: number;
}

export interface EnrichedEvent extends RawEvent {
  sevScore: number;
  finalSeverity: Severity;
  impactIndex: number;
}

export function computeSeverity(e: RawEvent): EnrichedEvent {
  const m = Math.min(1, (e.metrics.magnitude ?? 0) / 10);
  const s = Math.min(1, (e.metrics.speed ?? 0) / 1);
  const r = Math.min(1, (e.metrics.spread ?? 0));
  const c = Math.min(1, (e.metrics.casualties ?? 0) / 1000);

  const sevScore = 0.35 * m + 0.25 * s + 0.2 * r + 0.2 * c;
  const finalSeverity = e.severity ?? scoreToSeverity(sevScore);
  const impactIndex = sevScore * (e.metrics.infraLoss ?? 0);

  return { ...e, sevScore, finalSeverity, impactIndex };
}

export function scoreToSeverity(score: number): Severity {
  if (score >= 0.8) return "critical";
  if (score >= 0.6) return "high";
  if (score >= 0.35) return "medium";
  return "low";
}
