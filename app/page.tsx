"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type MomentumResult = {
  label: string;
  symbol: string;
  chainId?: string;
  url?: string;
  priceUsd?: number | null;
  volumeAccel?: number;
  buyAccel?: number;
  liquidityUsd?: number;
  priceChangeM5?: number;
  priceChangeH1?: number;
  reasons?: string[];
  hit?: boolean;
  lowLiquidity?: boolean;
  source?: "manual" | "altrank";
  altRank?: number;
  error?: string;
};

const REFRESH_MS = 30_000;

function formatUsd(n: number | null | undefined) {
  if (n == null) return "—";
  if (n < 0.01) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function formatCompactUsd(n: number | undefined) {
  if (n == null) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

function formatAccel(n: number | undefined) {
  if (n === undefined) return "—";
  if (n === Infinity) return "∞";
  return `${n.toFixed(1)}×`;
}

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const sec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  return `${Math.floor(sec / 60)}m ago`;
}

export default function Home() {
  const [results, setResults] = useState<MomentumResult[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch("/api/momentum", { cache: "no-store" });
      if (!res.ok) throw new Error("request failed");
      const data = await res.json();
      setResults(data.results ?? []);
      setUpdatedAt(data.updatedAt ?? null);
      setError(null);
    } catch {
      setError("Connection failed; retrying automatically.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => load(), REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const hits = useMemo(() => results.filter((r) => r.hit), [results]);
  const rest = useMemo(() => results.filter((r) => !r.hit && !r.error), [results]);
  const errored = useMemo(() => results.filter((r) => r.error), [results]);
  const lowLiquidityCount = rest.filter((r) => r.lowLiquidity).length;

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_14px_rgba(200,255,77,0.8)]" />
                <span className="text-[11px] font-semibold tracking-[0.16em] text-accent">ON-CHAIN MONITOR</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-ink">Momentum</h1>
              <p className="mt-1.5 max-w-md text-sm leading-6 text-mute">
                Real buying and volume acceleration on-chain, before social buzz takes off.
              </p>
            </div>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              aria-label="Refresh data"
              className="mt-1 flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-line bg-panel text-mute transition active:scale-95 disabled:opacity-50"
            >
              <span className={`text-lg ${refreshing ? "animate-spin" : ""}`}>↻</span>
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <Summary value={hits.length} label="Active momentum" accent />
            <Summary value={results.length} label="Monitored assets" />
            <Summary value={lowLiquidityCount} label="Low liquidity" warning={lowLiquidityCount > 0} />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-mute">
            <span>{loading ? "Fetching live data…" : updatedAt ? `Last update ${timeAgo(updatedAt)}` : ""}</span>
            <span className="font-mono">auto · 30s</span>
          </div>
        </header>

        {error && (
          <div className="mb-5 rounded-2xl border border-down/20 bg-down/[0.07] px-4 py-3 text-sm text-down">
            {error}
          </div>
        )}

        {!loading && results.length === 0 && (
          <div className="rounded-3xl border border-dashed border-line bg-panel px-5 py-10 text-center shadow-panel">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-panel2 text-xl">＋</div>
            <p className="font-bold text-ink">Watchlist is empty</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-mute">
              Add verified pairs to <code className="rounded bg-panel2 px-1.5 py-0.5 font-mono text-accent">lib/watchlist.ts</code> and deploy again to get started.
            </p>
          </div>
        )}

        {hits.length > 0 && (
          <section className="mb-7">
            <SectionTitle title="Active momentum" count={hits.length} accent />
            <div className="flex flex-col gap-3">
              {hits.map((r, i) => <TokenCard key={`${r.label}-${r.chainId}-${i}`} r={r} />)}
            </div>
          </section>
        )}

        {rest.length > 0 && (
          <section>
            <SectionTitle title="Market monitoring" count={rest.length} />
            <div className="flex flex-col gap-3">
              {rest.map((r, i) => <TokenCard key={`${r.label}-${r.chainId}-${i}`} r={r} />)}
            </div>
          </section>
        )}

        {errored.length > 0 && (
          <section className="mt-7 pb-8">
            <SectionTitle title="Needs review" count={errored.length} />
            <div className="flex flex-col gap-2">
              {errored.map((r, i) => (
                <div key={`${r.label}-${i}`} className="rounded-2xl border border-line bg-panel/70 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-ink">{r.label}</span>
                    <span className="rounded-full bg-panel2 px-2 py-1 text-[10px] text-mute">{r.source === "altrank" ? "AltRank" : "Manual"}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-mute">{r.error}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {results.length > 0 && (
          <footer className="mt-8 border-t border-line pt-4 pb-6 text-center text-[11px] leading-5 text-mute">
            Monitoring only; no trades are executed. Check each pair on DexScreener before making any decision.
          </footer>
        )}
      </div>
    </main>
  );
}

function Summary({ value, label, accent, warning }: { value: number; label: string; accent?: boolean; warning?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-panel px-3 py-3">
      <div className={`font-mono text-xl font-bold ${accent ? "text-accent" : warning ? "text-down" : "text-ink"}`}>{value}</div>
      <div className="mt-1 text-[10px] text-mute">{label}</div>
    </div>
  );
}

function SectionTitle({ title, count, accent }: { title: string; count: number; accent?: boolean }) {
  return (
    <div className="mb-3 flex items-center gap-2 px-1">
      <h2 className={`text-xs font-bold ${accent ? "text-accent" : "text-mute"}`}>{title}</h2>
      <span className="rounded-full bg-panel2 px-1.5 py-0.5 font-mono text-[9px] text-mute">{count}</span>
    </div>
  );
}

function TokenCard({ r }: { r: MomentumResult }) {
  const priceUp = (r.priceChangeM5 ?? 0) >= 0;
  const isLow = Boolean(r.lowLiquidity);

  return (
    <a
      href={r.url ?? "#"}
      target="_blank"
      rel="noreferrer"
      className={`group block rounded-3xl border p-4 shadow-panel transition duration-200 active:scale-[0.99] ${
        r.hit
          ? "border-accent/30 bg-[linear-gradient(135deg,rgba(200,255,77,0.09),rgba(18,22,31,0.98)_45%)]"
          : isLow
            ? "border-down/20 bg-panel/80"
            : "border-line bg-panel hover:border-line/80"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-base font-bold text-ink">{r.symbol || r.label}</span>
            {r.source === "altrank" && r.altRank != null && (
              <span className="rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">AltRank #{r.altRank}</span>
            )}
            {r.source === "manual" && (
              <span className="rounded-full border border-line bg-panel2 px-2 py-0.5 text-[10px] text-mute">Watchlist</span>
            )}
          </div>
          <div className="mt-1 text-[10px] text-mute">{r.label} · {r.chainId}</div>
        </div>
        <div className="shrink-0 text-left">
          <div className="font-mono text-sm font-bold text-ink">{formatUsd(r.priceUsd)}</div>
          <div className={`mt-1 text-[10px] font-mono ${priceUp ? "text-up" : "text-down"}`}>
            {priceUp ? "▲" : "▼"} {Math.abs(r.priceChangeM5 ?? 0).toFixed(1)}% / 5m
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Metric label="Volume accel" value={formatAccel(r.volumeAccel)} />
        <Metric label="Buy accel" value={formatAccel(r.buyAccel)} />
        <Metric label="Liquidity" value={formatCompactUsd(r.liquidityUsd)} />
      </div>

      {r.reasons && r.reasons.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {r.reasons.map((reason) => (
            <span key={reason} className="rounded-full border border-accent/15 bg-accent/[0.07] px-2 py-1 text-[10px] font-medium text-accent">{reason}</span>
          ))}
        </div>
      )}

      {isLow && (
        <div className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-down">
          <span>⚠</span> Liquidity below safety threshold; signal is not activated
        </div>
      )}
    </a>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-panel2/80 px-2 py-2.5 text-center">
      <div className="text-[9px] text-mute">{label}</div>
      <div className="mt-1 font-mono text-sm font-bold text-ink">{value}</div>
    </div>
  );
}
