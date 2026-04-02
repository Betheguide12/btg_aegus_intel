import { NextResponse } from "next/server";
import { computeSeverity, RawEvent } from "@/lib/events";

export const runtime = "nodejs";

const mockEvents: RawEvent[] = [
  {
    id: "EVT-1",
    ts: new Date().toISOString(),
    lat: 20.5937,
    lon: 78.9629,
    country: "India",
    city: "Mumbai",
    region: "Asia",
    domain: "economic",
    subType: "market_shock",
    description: "Index drop after policy announcement.",
    metrics: { magnitude: 5, speed: 0.3, spread: 0.6, casualties: 0, infraLoss: 120e6 }
  },
  // add more seed events here
];

export async function GET() {
  const enriched = mockEvents.map(computeSeverity);
  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    events: enriched,
  });
}
