import { NextResponse } from "next/server";
import { WATCHLIST } from "@/lib/watchlist";
import { fetchPair } from "@/lib/dexscreener";
import { analyzePair } from "@/lib/momentum";

export const dynamic = "force-dynamic";

export async function GET() {
  if (WATCHLIST.length === 0) {
    return NextResponse.json({ results: [], updatedAt: new Date().toISOString() });
  }

  const results = await Promise.all(
    WATCHLIST.map(async (item) => {
      const pair = await fetchPair(item.chainId, item.pairAddress);
      if (!pair) {
        return {
          label: item.label,
          error: "داده‌ای برای این جفت‌ارز پیدا نشد",
        };
      }
      return analyzePair(item.label, pair);
    })
  );

  return NextResponse.json({
    results,
    updatedAt: new Date().toISOString(),
  });
}
