/**
 * Hitung Husking Yield (%)
 * Formula: beras pecah kulit / padi input × 100
 * Benchmark: 78–82%
 */
export function calculateHuskingYield(
  brownRiceOutput: number,
  paddyInput: number
): number {
  if (paddyInput === 0) return 0;
  return Number(((brownRiceOutput / paddyInput) * 100).toFixed(2));
}

/**
 * Hitung Polishing Yield (%)
 * Formula: beras putih / beras pecah kulit × 100
 * Benchmark: 95–98%
 */
export function calculatePolishingYield(
  whiteRiceOutput: number,
  brownRiceInput: number
): number {
  if (brownRiceInput === 0) return 0;
  return Number(((whiteRiceOutput / brownRiceInput) * 100).toFixed(2));
}

/**
 * Hitung Overall Milling Yield (%)
 * Formula: total beras jadi / padi masuk × 100
 * Benchmark: 60–65%
 */
export function calculateOverallYield(
  totalFinishedGoodsKg: number,
  paddyInputKg: number
): number {
  if (paddyInputKg === 0) return 0;
  return Number(((totalFinishedGoodsKg / paddyInputKg) * 100).toFixed(2));
}

/**
 * Hitung Whole Grain Ratio (%)
 * Formula: beras utuh / total beras sortasi × 100
 * Benchmark: ≥70%
 */
export function calculateWholeGrainRatio(
  wholeGrainKg: number,
  totalSortedKg: number
): number {
  if (totalSortedKg === 0) return 0;
  return Number(((wholeGrainKg / totalSortedKg) * 100).toFixed(2));
}

/**
 * Tentukan grade produk berdasarkan whole grain ratio
 * ≥95% → PREMIUM
 * ≥80% → MEDIUM
 * <80% → PATAH
 */
export function determineGrade(wholeGrainRatio: number): "PREMIUM" | "MEDIUM" | "PATAH" {
  if (wholeGrainRatio >= 95) return "PREMIUM";
  if (wholeGrainRatio >= 80) return "MEDIUM";
  return "PATAH";
}

/**
 * Hitung OEE mesin (%)
 * OEE = Availability × Performance × Quality
 * Simplified: hanya Availability yang dihitung dari downtime
 * Performance & Quality di-set 1.0 untuk simplifikasi
 */
export function calculateOEE(
  plannedTimeMinutes: number,
  downtimeMinutes: number
): number {
  if (plannedTimeMinutes === 0) return 0;
  const availability = (plannedTimeMinutes - downtimeMinutes) / plannedTimeMinutes;
  return Number((availability * 100).toFixed(2));
}
