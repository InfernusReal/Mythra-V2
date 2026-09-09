export function finiteInputNumber(
  input: Pick<HTMLInputElement, "valueAsNumber">,
  fallback: number,
): number {
  const value = input.valueAsNumber;
  return Number.isFinite(value) ? value : fallback;
}
