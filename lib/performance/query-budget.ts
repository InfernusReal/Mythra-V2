export interface QueryBudgetResult {
  operation: string;
  observed: number;
  maximum: number;
}

export function assertQueryBudget(operation: string, observed: number, maximum: number): QueryBudgetResult {
  if (!operation.trim()) throw new Error("Query-budget operation is required.");
  if (!Number.isInteger(observed) || observed < 0) throw new Error("Observed query count must be a non-negative integer.");
  if (!Number.isInteger(maximum) || maximum < 1) throw new Error("Maximum query count must be a positive integer.");
  if (observed > maximum) throw new Error(`${operation} exceeded its query budget: ${observed}/${maximum}.`);
  return { operation, observed, maximum };
}
