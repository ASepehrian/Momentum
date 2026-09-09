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
  const altrankCount = results.filter((r) => r.source === "altrank").length;

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="hero mb-6">
          <div className="relative z-10">
            <nav className="mb-10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="brand-mark">M</span>
                <span className="text-sm font-bold tracking-tight text-ink">Momentum</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-medium text-mute">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-up" /> Live on-chain monitor
              </div>
            </nav>

            <div className="grid items-end gap-8 lg:grid-cols-[1.35fr_.65fr]">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                  Early momentum intelligence
                </div>
                <h1 className="max-w-3xl text-4xl font-black leading-[1.02] tracking-[-0.04em] text-ink sm:text-6xl">
                  Spot buying momentum <span className="text-accent">before the crowd.</span>
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-mute sm:text-base">
                  Real-time volume and buy acceleration across verified token pairs, enriched with the exact AltRank signals selected by the AI Trading Agent.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => load(true)}
                    disabled={refreshing}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 text-xs font-black text-base transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
                  >
                    <span className={refreshing ? "animate-spin" : ""}>↻</span>
                    {refreshing ? "Refreshing" : "Refresh live data"}
                  </button>
                  <span className="text-[11px] text-mute">Automatic refresh every 30s</span>
                </div>
              </div>

              <div className="hero-stat rounded-3xl border border-white/10 bg-black/20 p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-mute">
                  <span>Live overview</span>
                  <span className="text-up">● Online</span>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <HeroStat value={hits.length} label="Active signals" accent />
                  <HeroStat value={results.length} label="Assets tracked" />
                  <HeroStat value={altrankCount} label="AltRank picks" />
                  <HeroStat value={lowLiquidityCount} label="Low liquidity" warning={lowLiquidityCount > 0} />
                </div>
                <div className="mt-5 border-t border-white/10 pt-4 text-[10px] text-mute">
                  {loading ? "Scanning live market data…" : updatedAt ? `Last scan ${timeAgo(updatedAt)}` : "Waiting for first scan"}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          <Insight icon="01" title="Market data" text="Live DEX volume, buys and liquidity" />
          <Insight icon="02" title="Smart selection" text="AltRank signals from the AI agent" />
          <Insight icon="03" title="Momentum engine" text="Acceleration over the recent baseline" />
          <Insight icon="04" title="Risk filter" text="Low-liquidity pairs stay inactive" />
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-down/20 bg-down/[0.07] px-4 py-3 text-sm text-down">{error}</div>
        )}

        {hits.length > 0 && (
          <section className="mb-8">
            <SectionTitle title="Active momentum" subtitle="Signals crossing the activation threshold" count={hits.length} accent />
            <div className="grid gap-4 lg:grid-cols-2">
              {hits.map((r, i) => <TokenCard key={`${r.label}-${r.chainId}-${i}`} r={r} featured />)}
            </div>
          </section>
        )}

        {rest.length > 0 && (
          <section>
            <SectionTitle title="Market monitor" subtitle="Everything currently being watched" count={rest.length} />
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {rest.map((r, i) => <TokenCard key={`${r.label}-${r.chainId}-${i}`} r={r} />)}
            </div>
          </section>
        )}

        {!loading && results.length === 0 && (
          <div className="rounded-3xl border border-dashed border-line bg-panel px-5 py-14 text-center shadow-panel">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-panel2 text-xl text-accent">＋</div>
            <p className="font-bold text-ink">No assets are being monitored</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-mute">
              Add verified pairs to <code className="rounded bg-panel2 px-1.5 py-0.5 font-mono text-accent">lib/watchlist.ts</code> and deploy again.
            </p>
          </div>
        )}

        {errored.length > 0 && (
          <section className="mt-8">
            <SectionTitle title="Needs review" subtitle="Sources that could not be resolved" count={errored.length} />
            <div className="grid gap-3 md:grid-cols-2">
              {errored.map((r, i) => (
                <div key={`${r.label}-${i}`} className="rounded-2xl border border-line bg-panel/70 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-ink">{r.label}</span>
                    <span className="rounded-full bg-panel2 px-2 py-1 text-[10px] text-mute">{r.source === "altrank" ? "AltRank" : "Watchlist"}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-mute">{r.error}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-12 border-t border-line py-7 text-center text-[11px] leading-6 text-mute">
          <div className="mb-1 font-semibold text-ink">Momentum</div>
          Monitoring only — no trades are executed. Always verify a pair on DexScreener before making a decision.
        </footer>
      </div>
    </main>
  );
}

function HeroStat({ value, label, accent, warning }: { value: number; label: string; accent?: boolean; warning?: boolean }) {
  return (
    <div>
      <div className={`font-mono text-2xl font-bold ${accent ? "text-accent" : warning ? "text-down" : "text-ink"}`}>{value}</div>
      <div className="mt-1 text-[10px] text-mute">{label}</div>
    </div>
  );
}

function Insight({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel/70 p-4 transition hover:border-white/10 hover:bg-panel">
      <div className="mb-3 font-mono text-[10px] font-bold text-accent">{icon}</div>
      <div className="text-xs font-bold text-ink">{title}</div>
      <div className="mt-1 text-[10px] leading-5 text-mute">{text}</div>
    </div>
  );
}

function SectionTitle({ title, subtitle, count, accent }: { title: string; subtitle: string; count: number; accent?: boolean }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 px-1">
      <div>
        <div className="flex items-center gap-2">
          <h2 className={`text-sm font-bold ${accent ? "text-accent" : "text-ink"}`}>{title}</h2>
          <span className="rounded-full bg-panel2 px-2 py-0.5 font-mono text-[9px] text-mute">{count}</span>
        </div>
        <p className="mt-1 text-[10px] text-mute">{subtitle}</p>
      </div>
      <div className="hidden text-[9px] font-mono uppercase tracking-widest text-mute sm:block">Live feed</div>
    </div>
  );
}

function TokenCard({ r, featured }: { r: MomentumResult; featured?: boolean }) {
  const priceUp = (r.priceChangeM5 ?? 0) >= 0;
  const isLow = Boolean(r.lowLiquidity);

  return (
    <a
      href={r.url ?? "#"}
      target="_blank"
      rel="noreferrer"
      className={`token-card group block rounded-3xl border p-5 shadow-panel transition duration-200 active:scale-[0.99] ${
        featured
          ? "featured-card border-accent/30 bg-[linear-gradient(145deg,rgba(200,255,77,0.11),rgba(18,22,31,0.96)_48%)]"
          : isLow
            ? "border-down/20 bg-panel/80"
            : "border-line bg-panel/80 hover:border-white/10"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-lg font-black tracking-tight text-ink">{r.symbol || r.label}</span>
            {featured && <span className="rounded-full bg-accent px-2 py-1 text-[9px] font-black uppercase tracking-wider text-base">Active</span>}
            {r.source === "altrank" && r.altRank != null && (
              <span className="rounded-full border border-accent/20 bg-accent/10 px-2 py-1 text-[9px] font-semibold text-accent">AltRank #{r.altRank}</span>
            )}
            {r.source === "manual" && <span className="rounded-full border border-line bg-panel2 px-2 py-1 text-[9px] text-mute">Watchlist</span>}
          </div>
          <div className="mt-1 text-[10px] text-mute">{r.label} · {r.chainId}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-base font-bold text-ink">{formatUsd(r.priceUsd)}</div>
          <div className={`mt-1 text-[10px] font-mono font-semibold ${priceUp ? "text-up" : "text-down"}`}>
            {priceUp ? "▲" : "▼"} {Math.abs(r.priceChangeM5 ?? 0).toFixed(1)}% <span className="text-mute">5m</span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Metric label="Volume acceleration" value={formatAccel(r.volumeAccel)} highlight={featured} />
        <Metric label="Buy acceleration" value={formatAccel(r.buyAccel)} highlight={featured} />
        <Metric label="Liquidity" value={formatCompactUsd(r.liquidityUsd)} />
      </div>

      {r.reasons && r.reasons.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {r.reasons.map((reason) => (
            <span key={reason} className="rounded-full border border-accent/15 bg-accent/[0.07] px-2.5 py-1 text-[10px] font-medium text-accent">{reason}</span>
          ))}
        </div>
      )}

      {isLow && (
        <div className="mt-4 flex items-center gap-1.5 text-[10px] font-medium text-down">
          <span>⚠</span> Liquidity below safety threshold; signal is not activated
        </div>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-3 text-[9px] uppercase tracking-widest text-mute">
        <span>Open on DexScreener</span>
        <span className="transition group-hover:translate-x-0.5 group-hover:text-accent">↗</span>
      </div>
    </a>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/[0.04] bg-black/15 px-2 py-3 text-center">
      <div className="text-[9px] leading-4 text-mute">{label}</div>
      <div className={`mt-1 font-mono text-base font-bold ${highlight ? "text-accent" : "text-ink"}`}>{value}</div>
    </div>
  );
}
