export const CUSTOM_PORTFOLIO_KEY_PREFIX = "custom:";

export type CustomPortfolioDto = {
  id: string;
  name: string;
  annualReturnRate: number;
  color: string;
  sortOrder: number;
};

export function customPortfolioKey(id: string): string {
  return `${CUSTOM_PORTFOLIO_KEY_PREFIX}${id}`;
}

export function isCustomPortfolioKey(key: string): boolean {
  return key.startsWith(CUSTOM_PORTFOLIO_KEY_PREFIX);
}

export function customPortfolioIdFromKey(key: string): string | null {
  if (!isCustomPortfolioKey(key)) {
    return null;
  }

  return key.slice(CUSTOM_PORTFOLIO_KEY_PREFIX.length);
}

export function buildCustomReturnsMap(
  portfolios: CustomPortfolioDto[],
): Record<string, number> {
  return Object.fromEntries(
    portfolios.map((portfolio) => [
      customPortfolioKey(portfolio.id),
      portfolio.annualReturnRate,
    ]),
  );
}
