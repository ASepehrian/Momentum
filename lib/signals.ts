export type AltRankSignal = {
  symbol: string;
  altRank: number;
};

const SIGNALS_URL = "https://ai-trading-agent-gemini.vercel.app/api/signals";

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function fetchTopAltRankSignals(limit = 3): Promise<AltRankSignal[]> {
  const res = await fetch(SIGNALS_URL, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Signal bot returned ${res.status}`);

  const payload: unknown = await res.json();
  const rawSignals = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && Array.isArray((payload as { signals?: unknown }).signals)
      ? (payload as { signals: unknown[] }).signals
      : [];

  return rawSignals
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const item = raw as Record<string, unknown>;
      const symbol = String(item.symbol ?? item.tokenSymbol ?? item.ticker ?? "").trim().toUpperCase();
      const rank = asNumber(item.altRank ?? item.alt_rank ?? item.rank);
      if (!symbol || rank === null || rank <= 0) return null;
      return { symbol, altRank: rank } satisfies AltRankSignal;
    })
    .filter((item): item is AltRankSignal => item !== null)
    .sort((a, b) => a.altRank - b.altRank)
    .slice(0, limit);
}
