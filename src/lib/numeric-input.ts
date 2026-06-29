const PERSIAN_DIGIT_OFFSET = "۰".charCodeAt(0);
const ARABIC_DIGIT_OFFSET = "٠".charCodeAt(0);

export function latinDigitFromChar(char: string): string {
  const code = char.charCodeAt(0);

  if (code >= 0x06f0 && code <= 0x06f9) {
    return String(code - PERSIAN_DIGIT_OFFSET);
  }

  if (code >= 0x0660 && code <= 0x0669) {
    return String(code - ARABIC_DIGIT_OFFSET);
  }

  return char;
}

/** Persian/Arabic digits and separators → Latin digits for parsing. */
export function normalizeNumericString(value: string): string {
  return value
    .split("")
    .map(latinDigitFromChar)
    .join("")
    .replace(/[٫،]/g, ".")
    .replace(/٬/g, "")
    .replace(/,/g, "");
}

export function parseLocalizedNumber(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const normalized = normalizeNumericString(trimmed);

  if (!normalized || normalized === "-" || normalized === "." || normalized === "-.") {
    return null;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

export function sanitizeIntegerInput(raw: string): string {
  return normalizeNumericString(raw).replace(/\D/g, "");
}

export function sanitizeDecimalInput(raw: string): string {
  let normalized = normalizeNumericString(raw).replace(/[^\d.-]/g, "");

  if (normalized.startsWith("-")) {
    normalized = `-${normalized.slice(1).replace(/-/g, "")}`;
  } else {
    normalized = normalized.replace(/-/g, "");
  }

  const dotIndex = normalized.indexOf(".");

  if (dotIndex === -1) {
    return normalized;
  }

  const integerPart = normalized.slice(0, dotIndex);
  const fractionalPart = normalized.slice(dotIndex + 1).replace(/\./g, "");

  return `${integerPart}.${fractionalPart}`;
}
