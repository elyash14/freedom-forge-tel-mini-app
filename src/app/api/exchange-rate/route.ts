import { NextResponse } from "next/server";

const FALLBACK_USD_TOMAN_RATE = 90000;

type ExchangeRateResponse = {
  rate: number;
  source: "live" | "fallback";
};

async function fetchLiveRate(): Promise<number | null> {
  try {
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD",
      { next: { revalidate: 3600 } },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { rates?: { IRR?: number } };
    const irrPerUsd = data.rates?.IRR;

    if (!irrPerUsd || irrPerUsd <= 0) {
      return null;
    }

    // API returns Rial per USD; convert to Toman (1 Toman = 10 Rial).
    return irrPerUsd / 10;
  } catch {
    return null;
  }
}

export async function GET(): Promise<NextResponse<ExchangeRateResponse>> {
  const liveRate = await fetchLiveRate();

  if (liveRate) {
    return NextResponse.json({
      rate: Math.round(liveRate),
      source: "live",
    });
  }

  return NextResponse.json({
    rate: FALLBACK_USD_TOMAN_RATE,
    source: "fallback",
  });
}
