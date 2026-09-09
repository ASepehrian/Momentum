export type AltRankSignal = {
  symbol: string;
  altRank: number;
};

type UpstreamSignal = {
  symbol?: unknown;
  tokenSymbol?: unknown;
  ticker?: unknown;
  altRank?: unknown;
  alt_rank?: unknown;
  rank?: unknown;
  metrics?: {
    altRank?: unknown;
    alt_rank?: unknown;
    rank?: unknown;
  };
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

/**
 * Reads the same signal feed used by the AI Trading Agent page.
 * The upstream /api/signals endpoint returns the newest signals first;
 * each generated signal stores LunarCrush AltRank inside `metrics.altRank`.
 * We use the newest 3 unique symbols from that feed instead of rebuilding
 * a separate token list from another data source.
 */
export async function fetchTopAltRankSignals(limit = 3): Promise<AltRankSignal[]> {
  const res = await fetch(SIGNALS_URL, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`Signal bot returned ${res.status}`);

  const payload: unknown = await res.json();
  const rawSignals =
    payload && typeof payload === "object" && Array.isArray((payload as { signals?: unknown }).signals)
      ? (payload as { signals: unknown[] }).signals
      : Array.isArray(payload)
        ? payload
        : [];

  const selected: AltRankSignal[] = [];
  const seen = new Set<string>();

  // /api/signals is ordered by created_at DESC, so preserve that order.
  for (const raw of rawSignals) {
    if (!raw || typeof raw !== "object") continue;

    const item = raw as UpstreamSignal;
    const symbol = String(item.symbol ?? item.tokenSymbol ?? item.ticker ?? "")
      .trim()
      .toUpperCase();

    const rank = asNumber(
      item.metrics?.altRank ??
        item.metrics?.alt_rank ??
        item.metrics?.rank ??
        item.altRank ??
        item.alt_rank ??
        item.rank
    );

    if (!symbol || rank === null || rank <= 0 || seen.has(symbol)) continue;

    seen.add(symbol);
    selected.push({ symbol, altRank: rank });

    if (selected.length >= limit) break;
  }

  return selected;
}
