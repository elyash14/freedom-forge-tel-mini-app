export type AssetClassInput = {
  key: string;
  historicalNominalReturn: number;
};

export type PortfolioAllocation = Record<string, number>;

export type CalculatorInputs = {
  monthlyExpense: number;
  initialCapital: number;
  allocation: PortfolioAllocation;
  assetClasses: AssetClassInput[];
  inflationRate: number;
  monthlyContribution: number;
};

export type ProjectionRow = {
  year: number;
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
  | "inflationInvalid"
  | "contributionInvalid"
  | "realReturnNonPositive"
  | "unreachable";

export function calculateRealReturn(
  nominalReturn: number,
  inflationRate: number,
): number {
  return (1 + nominalReturn) / (1 + inflationRate) - 1;
}

export function calculateWeightedNominalReturn(
  allocation: PortfolioAllocation,
  assetClasses: AssetClassInput[],
): number {
  return assetClasses.reduce(
    (sum, asset) => sum + (allocation[asset.key] ?? 0) * asset.historicalNominalReturn,
    0,
  );
}

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
      startingCapital,
      annualContribution,
      returnEarned,
      endingCapital,
    });

    capital = endingCapital;
  }

  return rows;
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

  if (inputs.inflationRate <= 0 || inputs.inflationRate > 1) {
    errors.push("inflationInvalid");
  }

  if (inputs.monthlyContribution < 0) {
    errors.push("contributionInvalid");
  }

  const keys = inputs.assetClasses.map((a) => a.key);
  const totalWeight = keys.reduce(
    (sum, key) => sum + (inputs.allocation[key] ?? 0),
    0,
  );

  if (keys.length === 0 || totalWeight <= 0) {
    errors.push("allocationInvalid");
  }

  const nominal = calculateWeightedNominalReturn(
    normalizeAllocation(inputs.allocation, keys),
    inputs.assetClasses,
  );
  const realReturn = calculateRealReturn(nominal, inputs.inflationRate);

  if (realReturn <= 0) {
    errors.push("realReturnNonPositive");
  }

  return { isValid: errors.length === 0, errors };
}

export function calculateFreedom(inputs: CalculatorInputs): CalculatorResult | null {
  const validation = validateCalculatorInputs(inputs);
  if (!validation.isValid) {
    return null;
  }

  const keys = inputs.assetClasses.map((a) => a.key);
  const normalized = normalizeAllocation(inputs.allocation, keys);
  const nominalReturnRate = calculateWeightedNominalReturn(
    normalized,
    inputs.assetClasses,
  );
  const realReturnRate = calculateRealReturn(
    nominalReturnRate,
    inputs.inflationRate,
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
    ),
  };
}
