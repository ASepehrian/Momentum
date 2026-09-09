import { NextResponse } from "next/server";
import { WATCHLIST } from "@/lib/watchlist";
import { fetchPair, searchBestPair } from "@/lib/dexscreener";
import { analyzePair, type MomentumResult } from "@/lib/momentum";
import { fetchTopAltRankSignals } from "@/lib/signals";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ErrorResult = { label: string; source: "manual" | "altrank"; error: string };

export async function GET() {
  const results: Array<MomentumResult | ErrorResult> = [];
  const seen = new Set<string>();
  const manualBySymbol = new Map<string, MomentumResult>();

  await Promise.all(WATCHLIST.map(async (item) => {
    const pair = await fetchPair(item.chainId, item.pairAddress);
    if (!pair) {
      results.push({ label: item.label, source: "manual", error: "جفت‌ارز پیدا نشد یا API در دسترس نیست" });
      return;
    }
    const result = analyzePair(item.label, pair, "manual");
    results.push(result);
    seen.add(`${pair.chainId}:${pair.baseToken.address.toLowerCase()}`);
    manualBySymbol.set(pair.baseToken.symbol.toUpperCase(), result);
  }));

  try {
    const signals = await fetchTopAltRankSignals(3);
    await Promise.all(signals.map(async (signal) => {
      const pair = await searchBestPair(signal.symbol);
      if (!pair) {
        results.push({ label: signal.symbol, source: "altrank", error: "برای این نماد جفت‌ارز معتبری در DexScreener پیدا نشد" });
        return;
      }
      const key = `${pair.chainId}:${pair.baseToken.address.toLowerCase()}`;
      if (seen.has(key)) {
        const manual = manualBySymbol.get(signal.symbol);
        if (manual) manual.altRank = signal.altRank;
        return;
      }
      seen.add(key);
      results.push(analyzePair(signal.symbol, pair, "altrank", signal.altRank));
    }));
  } catch {
    results.push({ label: "فید AltRank", source: "altrank", error: "فید سیگنال اجتماعی فعلاً در دسترس نیست" });
  }

  results.sort((a, b) => {
    if ("hit" in a && "hit" in b) return Number(b.hit) - Number(a.hit);
    if ("hit" in a) return -1;
    if ("hit" in b) return 1;
    return 0;
  });

  return NextResponse.json({ results, updatedAt: new Date().toISOString() });
}
