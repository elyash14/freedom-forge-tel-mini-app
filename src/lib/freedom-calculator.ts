import {
  calculateExpectedInflation,
  calculateHistoricalNominalReturn,
  calculateHistoricalRealReturn,
  capFutureInflation,
  realToNominalReturn,
  type HistoricalReturnRow,
} from "@/lib/historical-returns";

export type ProjectionScenario = "real" | "fixed" | "accelerating";

export type PortfolioAllocation = Record<string, number>;

export type CalculatorInputs = {
  monthlyExpense: number;
  initialCapital: number;
  allocation: PortfolioAllocation;
  historicalData: HistoricalReturnRow[];
  monthlyContribution: number;
};

export type ProjectionRow = {
  year: number;
  inflationRate: number;
  monthlyContributionStart: number;
  startingCapital: number;
  annualContribution: number;
  returnEarned: number;
  endingCapital: number;
};

export type CalculatorResult = {
  monthlyExpense: number;
  initialCapital: number;
  nominalReturnRate: number;
  realReturnRate: number;
  targetCapital: number;
  monthlyContribution: number;
  yearsToFreedom: number;
  projection: ProjectionRow[];
};

export type CalculatorValidationError =
  | "expenseRequired"
  | "capitalInvalid"
  | "allocationInvalid"
  | "contributionInvalid"
  | "realReturnNonPositive"
  | "historicalDataMissing"
  | "unreachable";

export function calculateTargetCapital(
  monthlyExpense: number,
  realReturnRate: number,
): number | null {
  if (realReturnRate <= 0) {
    return null;
  }

  return (monthlyExpense * 12) / realReturnRate;
}

export function calculateYearsToFreedom(
  initialCapital: number,
  monthlyContribution: number,
  targetCapital: number,
  realReturnRate: number,
): number | null {
  if (realReturnRate <= 0 || targetCapital <= 0) {
    return null;
  }

  if (initialCapital >= targetCapital) {
    return 0;
  }

  const annualContribution = monthlyContribution * 12;
  const numerator = targetCapital * realReturnRate + annualContribution;
  const denominator = initialCapital * realReturnRate + annualContribution;

  if (denominator <= 0 || numerator <= denominator) {
    return null;
  }

  return Math.log(numerator / denominator) / Math.log(1 + realReturnRate);
}

export function buildYearlyProjection(
  initialCapital: number,
  monthlyContribution: number,
  realReturnRate: number,
  years: number,
  avgInflation = 0,
): ProjectionRow[] {
  const rows: ProjectionRow[] = [];
  let capital = initialCapital;
  const annualContribution = monthlyContribution * 12;

  for (let year = 1; year <= years; year++) {
    const startingCapital = capital;
    const returnEarned = (startingCapital + annualContribution) * realReturnRate;
    const endingCapital = startingCapital + annualContribution + returnEarned;

    rows.push({
      year,
      inflationRate: avgInflation,
      monthlyContributionStart: monthlyContribution,
      startingCapital,
      annualContribution,
      returnEarned,
      endingCapital,
    });

    capital = endingCapital;
  }

  return rows;
}

export function buildNominalYearlyProjection(
  initialCapital: number,
  monthlyContribution: number,
  realReturnRate: number,
  avgInflation: number,
  years: number,
): ProjectionRow[] {
  const cappedInflation = capFutureInflation(avgInflation);
  const rows: ProjectionRow[] = [];
  let capital = initialCapital;
  let monthlyContributionStart =
    monthlyContribution * (1 + cappedInflation);

  for (let year = 1; year <= years; year++) {
    const currentYearInflation = cappedInflation;
    const nominalReturnRate = realToNominalReturn(
      realReturnRate,
      currentYearInflation,
    );
    const annualContribution = monthlyContributionStart * 12;
    const startingCapital = capital;
    const returnEarned =
      (startingCapital + annualContribution) * nominalReturnRate;
    const endingCapital = startingCapital + annualContribution + returnEarned;

    rows.push({
      year,
      inflationRate: currentYearInflation,
      monthlyContributionStart,
      startingCapital,
      annualContribution,
      returnEarned,
      endingCapital,
    });

    capital = endingCapital;
    monthlyContributionStart *= 1 + currentYearInflation;
  }

  return rows;
}

export function buildAcceleratingInflationProjection(
  initialCapital: number,
  monthlyContribution: number,
  realReturnRate: number,
  baseInflation: number,
  inflationDelta: number,
  years: number,
): ProjectionRow[] {
  const rows: ProjectionRow[] = [];
  let capital = initialCapital;
  let currentYearInflation = capFutureInflation(baseInflation);
  let monthlyContributionStart =
    monthlyContribution * (1 + currentYearInflation);

  for (let year = 1; year <= years; year++) {
    if (year > 1) {
      currentYearInflation = capFutureInflation(
        currentYearInflation + inflationDelta,
      );
      monthlyContributionStart *= 1 + currentYearInflation;
    }

    const nominalReturnRate = realToNominalReturn(
      realReturnRate,
      currentYearInflation,
    );
    const annualContribution = monthlyContributionStart * 12;
    const startingCapital = capital;
    const returnEarned =
      (startingCapital + annualContribution) * nominalReturnRate;
    const endingCapital = startingCapital + annualContribution + returnEarned;

    rows.push({
      year,
      inflationRate: currentYearInflation,
      monthlyContributionStart,
      startingCapital,
      annualContribution,
      returnEarned,
      endingCapital,
    });

    capital = endingCapital;
  }

  return rows;
}

export function nominalTargetCapitalAtYear(
  realTargetCapital: number,
  avgInflation: number,
  year: number,
): number {
  const cappedInflation = capFutureInflation(avgInflation);
  return realTargetCapital * Math.pow(1 + cappedInflation, year);
}

export function nominalTargetCapitalAccelerating(
  realTargetCapital: number,
  baseInflation: number,
  inflationDelta: number,
  year: number,
): number {
  let factor = 1;
  let currentYearInflation = capFutureInflation(baseInflation);

  for (let y = 1; y <= year; y++) {
    if (y > 1) {
      currentYearInflation = capFutureInflation(
        currentYearInflation + inflationDelta,
      );
    }

    factor *= 1 + currentYearInflation;
  }

  return realTargetCapital * factor;
}

export function normalizeAllocation(
  allocation: PortfolioAllocation,
  assetKeys: string[],
): PortfolioAllocation {
  const total = assetKeys.reduce((sum, key) => sum + (allocation[key] ?? 0), 0);

  if (total <= 0) {
    const even = 1 / assetKeys.length;
    return Object.fromEntries(assetKeys.map((key) => [key, even]));
  }

  return Object.fromEntries(
    assetKeys.map((key) => [key, (allocation[key] ?? 0) / total]),
  );
}

export function validateCalculatorInputs(inputs: CalculatorInputs): {
  isValid: boolean;
  errors: CalculatorValidationError[];
} {
  const errors: CalculatorValidationError[] = [];

  if (inputs.monthlyExpense <= 0) {
    errors.push("expenseRequired");
  }

  if (inputs.initialCapital < 0) {
    errors.push("capitalInvalid");
  }

  if (inputs.monthlyContribution < 0) {
    errors.push("contributionInvalid");
  }

  if (inputs.historicalData.length === 0) {
    errors.push("historicalDataMissing");
  }

  const totalWeight = Object.values(inputs.allocation).reduce(
    (sum, weight) => sum + weight,
    0,
  );

  if (totalWeight <= 0) {
    errors.push("allocationInvalid");
  }

  const realReturn = calculateHistoricalRealReturn(
    inputs.allocation,
    inputs.historicalData,
  );

  if (inputs.historicalData.length > 0 && realReturn <= 0) {
    errors.push("realReturnNonPositive");
  }

  return { isValid: errors.length === 0, errors };
}

export function calculateFreedom(inputs: CalculatorInputs): CalculatorResult | null {
  const validation = validateCalculatorInputs(inputs);
  if (!validation.isValid) {
    return null;
  }

  const realReturnRate = calculateHistoricalRealReturn(
    inputs.allocation,
    inputs.historicalData,
  );
  const nominalReturnRate = calculateHistoricalNominalReturn(
    inputs.allocation,
    inputs.historicalData,
  );
  const targetCapital = calculateTargetCapital(
    inputs.monthlyExpense,
    realReturnRate,
  );

  if (targetCapital === null) {
    return null;
  }

  const yearsToFreedom = calculateYearsToFreedom(
    inputs.initialCapital,
    inputs.monthlyContribution,
    targetCapital,
    realReturnRate,
  );

  if (yearsToFreedom === null) {
    return null;
  }

  const projectionYears = Math.max(1, Math.ceil(yearsToFreedom));
  const avgInflation = calculateExpectedInflation(inputs.historicalData);

  return {
    monthlyExpense: inputs.monthlyExpense,
    initialCapital: inputs.initialCapital,
    nominalReturnRate,
    realReturnRate,
    targetCapital,
    monthlyContribution: inputs.monthlyContribution,
    yearsToFreedom,
    projection: buildYearlyProjection(
      inputs.initialCapital,
      inputs.monthlyContribution,
      realReturnRate,
      projectionYears,
      avgInflation,
    ),
  };
}
