export interface RawAIStats {
  id: string;
  ts: string;
  domain?: string;
  decisionsEvaluated: number;
  hallucinations: number;
  flaggedBiasCases: number;
  toxicityIncidents: number;
  overridesByHuman: number;
  criticalUseCases: number;
  driftScore: number;
  lastAuditDays: number;
}

export type AIDecision = "STOP" | "REVIEW" | "MONITOR" | "CONTINUE";

export interface EvaluatedAI extends RawAIStats {
  ethicalScore: number;
  decision: AIDecision;
}

export function ethicalScore(a: RawAIStats): number {
  const dec = Math.max(1, a.decisionsEvaluated);
  const hallucRate = a.hallucinations / dec;
  const biasRate = a.flaggedBiasCases / dec;
  const toxRate = a.toxicityIncidents / dec;
  const overrideRate =
    a.criticalUseCases > 0 ? a.overridesByHuman / a.criticalUseCases : 0;

  let score =
    1 -
    2 * hallucRate -
    3 * biasRate -
    5 * toxRate -
    1.5 * overrideRate -
    0.5 * a.driftScore;

  return Math.max(0, Math.min(1, score));
}

export function decision(score: number): AIDecision {
  if (score < 0.3) return "STOP";
  if (score < 0.5) return "REVIEW";
  if (score < 0.7) return "MONITOR";
  return "CONTINUE";
}

export function evaluateAI(a: RawAIStats): EvaluatedAI {
  const score = ethicalScore(a);
  return { ...a, ethicalScore: score, decision: decision(score) };
}
