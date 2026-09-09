import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { WATCHLIST } from "@/lib/watchlist";
import { fetchPair, searchBestPair } from "@/lib/dexscreener";
import { analyzePair, type MomentumResult } from "@/lib/momentum";
import { fetchTopAltRankSignals } from "@/lib/signals";
import { sendMomentumAlert, telegramConfigured } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const redis = Redis.fromEnv();
const ALERT_PREFIX = "momentum:active:";
const CRON_SECRET = process.env.CRON_SECRET;

type ErrorResult = { label: string; source: "manual" | "altrank"; error: string };

async function collectResults() {
  const results: Array<MomentumResult | ErrorResult> = [];
  const seen = new Set<string>();
  const manualBySymbol = new Map<string, MomentumResult>();

  await Promise.all(WATCHLIST.map(async (item) => {
    const pair = await fetchPair(item.chainId, item.pairAddress);
    if (!pair) return;
    const result = analyzePair(item.label, pair, "manual");
    results.push(result);
    seen.add(`${pair.chainId}:${pair.baseToken.address.toLowerCase()}`);
    manualBySymbol.set(pair.baseToken.symbol.toUpperCase(), result);
  }));

  try {
    const signals = await fetchTopAltRankSignals(3);
    await Promise.all(signals.map(async (signal) => {
      const pair = await searchBestPair(signal.symbol);
      if (!pair) return;
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
    // Alerting should keep working even if the AltRank feed is temporarily unavailable.
  }

  return results;
}

export async function GET(request: Request) {
  if (CRON_SECRET) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!telegramConfigured()) {
    return NextResponse.json({ ok: false, error: "Telegram environment variables are not configured" }, { status: 503 });
  }

  const results = await collectResults();
  const active = results.filter((r): r is MomentumResult => "hit" in r && r.hit);
  const activeKeys = new Set(active.map((r) => `${r.chainId}:${r.baseTokenAddress}`));

  for (const result of active) {
    const key = `${ALERT_PREFIX}${result.chainId}:${result.baseTokenAddress}`;
    const wasActive = await redis.get<boolean>(key);
    if (!wasActive) {
      await sendMomentumAlert(result);
    }
    await redis.set(key, true);
  }

  // Clear state for assets that are no longer active so a later re-entry can alert again.
  const knownKeys = await redis.keys(`${ALERT_PREFIX}*`);
  for (const key of knownKeys) {
    if (!activeKeys.has(key.slice(ALERT_PREFIX.length))) {
      await redis.del(key);
    }
  }

  return NextResponse.json({ ok: true, active: active.length, alertsEnabled: true, checkedAt: new Date().toISOString() });
}
