export const EXTERNAL_HOLDING_KEY_PREFIX = "external:";

export type ExternalHoldingDto = {
  id: string;
  assetKey: string;
  name: string;
  totalValue: number;
  sortOrder: number;
  isFreeform: boolean;
};

export function isFreeformExternalKey(assetKey: string): boolean {
  return assetKey.startsWith(EXTERNAL_HOLDING_KEY_PREFIX);
}

export function externalHoldingKey(id: string): string {
  return `${EXTERNAL_HOLDING_KEY_PREFIX}${id}`;
}

export function toExternalHoldingDto(holding: {
  id: string;
  assetKey: string;
  name: string;
  totalValue: number;
  sortOrder: number;
}): ExternalHoldingDto {
  return {
    id: holding.id,
    assetKey: holding.assetKey,
    name: holding.name,
    totalValue: holding.totalValue,
    sortOrder: holding.sortOrder,
    isFreeform: isFreeformExternalKey(holding.assetKey),
  };
}
