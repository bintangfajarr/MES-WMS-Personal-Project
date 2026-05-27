/**
 * Calculate paddy net weight
 * Net weight = Gross weight - Sack weight - (Gross weight × dirt% / 100)
 */
export function calculateNetWeight(
  grossWeight: number,
  sackWeight: number,
  dirtPercentage: number
): number {
  const dirtWeight = (grossWeight * dirtPercentage) / 100;
  return Number((grossWeight - sackWeight - dirtWeight).toFixed(2));
}
