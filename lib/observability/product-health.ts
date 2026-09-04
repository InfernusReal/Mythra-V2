export const productHealthDefinitions = Object.freeze({
  activation: "workspace has a writing session with at least one durable chapter save and positive uninterrupted-writing milliseconds",
  retention7: "active project has a meaningful writing session 7 days after activation",
  retention30: "active project has a meaningful writing session 30 days after activation",
  retention90: "active project has a meaningful writing session 90 days after activation",
  retention180: "active project has a meaningful writing session 180 days after activation",
  projectDepth: "bounded counts of active chapters, structure objects, entities, milestones and causal relations",
  coreConversion: "workspace transitions to an ACTIVE or TRIALING CORE subscription",
  exportPattern: "completed export count grouped by format and scope enum",
  recovery: "resolved conflict, restored snapshot or completed safe recovery action count",
  uninterruptedWritingTime: "sum of focused editor intervals excluding idle, navigation and modal interruption time",
  intelligenceInterest: "explicit future Intelligence interest event; never an active subscription or sellable entitlement",
  voluntaryStructureAdoption: "first explicit author structure action; prose-first projects remain valid",
  contextNavigationReduction: "ratio of context Peek/Open interactions to full route changes during writing sessions",
  captureHabit: "distinct active days with Capture opens and later processing actions",
  causalValue: "coded helpful, neutral, or burdensome feedback paired with bounded trace timing",
  autosaveTrust: "coded author trust feedback reviewed with save, recovery, and conflict outcomes",
  coreValueSentiment: "coded USD 15 Core price/value feedback; never free-signup volume",
  externalToolEscape: "coded writing-adjacent task that caused an author to leave Mythra"
});

export function uninterruptedWritingTime(intervals: readonly { startedAt: number; endedAt: number; interrupted: boolean }[]): number {
  return intervals.reduce((total, item) => total + (item.interrupted ? 0 : Math.max(0, item.endedAt - item.startedAt)), 0);
}

export function retainedAtDays(activationAt: Date, sessions: readonly Date[], days: 7 | 30 | 90 | 180): boolean {
  const threshold = activationAt.getTime() + days * 86_400_000;
  return sessions.some((session) => session.getTime() >= threshold);
}
