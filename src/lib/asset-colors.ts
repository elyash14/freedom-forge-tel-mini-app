export const ASSET_COLORS = [
  "#6C9BCF",
  "#7DD3C0",
  "#E8B86D",
  "#B794F6",
  "#F687B3",
  "#4FD1C5",
  "#FCA5A5",
  "#94A3B8",
];

export function colorForKey(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash + key.charCodeAt(i) * (i + 1)) % ASSET_COLORS.length;
  }
  return ASSET_COLORS[hash]!;
}
