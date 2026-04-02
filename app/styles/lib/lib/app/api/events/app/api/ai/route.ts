import { NextResponse } from "next/server";
import { evaluateAI, RawAIStats } from "@/lib/aiSentinel";

export const runtime = "nodejs";

const mockAI: RawAIStats[] = [
  {
    id: "MODEL-ALPHA",
    ts: new Date().toISOString(),
    domain: "threat_assessment",
    decisionsEvaluated: 500,
    hallucinations: 12,
    flaggedBiasCases: 6,
    toxicityIncidents: 1,
    overridesByHuman: 8,
    criticalUseCases: 40,
    driftScore: 0.18,
    lastAuditDays: 20
  }
];

export async function GET() {
  const evaluated = mockAI.map(evaluateAI);
  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    models: evaluated,
  });
}
