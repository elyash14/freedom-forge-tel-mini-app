export const CUSTOM_ASSET_KEY_PREFIX = "customAsset:";

export type CustomAssetDto = {
  id: string;
  name: string;
  annualReturnRate: number;
  color: string;
  sortOrder: number;
};

export function customAssetKey(id: string): string {
  return `${CUSTOM_ASSET_KEY_PREFIX}${id}`;
}

export function isCustomAssetKey(key: string): boolean {
  return key.startsWith(CUSTOM_ASSET_KEY_PREFIX);
}

export function customAssetIdFromKey(key: string): string | null {
  if (!isCustomAssetKey(key)) {
    return null;
  }

  return key.slice(CUSTOM_ASSET_KEY_PREFIX.length);
}

export function buildCustomReturnsMap(
  assets: CustomAssetDto[],
): Record<string, number> {
  return Object.fromEntries(
    assets.map((asset) => [customAssetKey(asset.id), asset.annualReturnRate]),
  );
}
