"use client";

import { useEffect, useState, useCallback } from "react";

type MomentumResult = {
  label: string;
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
  error?: string;
};

const REFRESH_MS = 30_000;

function formatUsd(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  if (n < 0.01) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function formatAccel(n: number | undefined) {
  if (n === undefined) return "—";
  if (n === Infinity) return "∞";
  return `${n.toFixed(1)}×`;
}

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const sec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (sec < 5) return "همین الان";
  if (sec < 60) return `${sec} ثانیه پیش`;
  return `${Math.floor(sec / 60)} دقیقه پیش`;
}

export default function Home() {
  const [results, setResults] = useState<MomentumResult[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/momentum", { cache: "no-store" });
      const data = await res.json();
      setResults(data.results ?? []);
      setUpdatedAt(data.updatedAt ?? null);
      setError(null);
    } catch (e) {
      setError("اتصال برقرار نشد — دوباره تلاش می‌کنیم");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const hits = results.filter((r) => r.hit);
  const rest = results.filter((r) => !r.hit && !r.error);
  const errored = results.filter((r) => r.error);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-8 sm:py-10 max-w-2xl mx-auto">
      <header className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">مومنتوم</h1>
          <p className="text-mute text-sm mt-1">
            شتاب حجم و خرید on-chain، جلوتر از سیگنال‌های اجتماعی
          </p>
        </div>
        <button
          onClick={load}
          className="shrink-0 rounded-full border border-line bg-panel px-4 py-2 text-xs text-mute active:scale-95 transition-transform"
        >
          به‌روزرسانی
        </button>
      </header>

      <div className="text-xs text-mute mb-6 font-mono">
        {loading ? "در حال بارگذاری…" : updatedAt ? `آخرین بروزرسانی: ${timeAgo(updatedAt)}` : ""}
      </div>

      {error && (
        <div className="rounded-2xl border border-down/30 bg-down/10 text-down text-sm px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="rounded-2xl border border-line bg-panel px-5 py-8 text-center">
          <p className="text-ink font-semibold mb-2">واچ‌لیست خالیه</p>
          <p className="text-mute text-sm leading-relaxed">
            برای شروع، جفت‌ارزهاتو داخل <code className="font-mono text-accent">lib/watchlist.ts</code> اضافه
            کن و دوباره دیپلوی کن.
          </p>
        </div>
      )}

      {hits.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs text-accent font-semibold mb-3">سیگنال فعال</h2>
          <div className="flex flex-col gap-3">
            {hits.map((r) => (
              <TokenCard key={r.label} r={r} />
            ))}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section>
          <h2 className="text-xs text-mute font-semibold mb-3">بقیه‌ی واچ‌لیست</h2>
          <div className="flex flex-col gap-3">
            {rest.map((r) => (
              <TokenCard key={r.label} r={r} />
            ))}
          </div>
        </section>
      )}

      {errored.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs text-mute font-semibold mb-3">خطا در دریافت</h2>
          <div className="flex flex-col gap-2">
            {errored.map((r) => (
              <div key={r.label} className="text-xs text-mute border border-line rounded-xl px-4 py-3">
                {r.label}: {r.error}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function TokenCard({ r }: { r: MomentumResult }) {
  const priceUp = (r.priceChangeM5 ?? 0) >= 0;

  return (
    <a
      href={r.url ?? "#"}
      target="_blank"
      rel="noreferrer"
      className={`block rounded-2xl border px-4 py-4 transition-colors ${
        r.hit ? "border-accent/40 bg-accent/[0.06]" : "border-line bg-panel"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold">{r.label}</span>
        <span className="font-mono text-sm text-mute">{formatUsd(r.priceUsd)}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Metric label="حجم" value={formatAccel(r.volumeAccel)} />
        <Metric label="خرید" value={formatAccel(r.buyAccel)} />
        <Metric
          label="قیمت ۵د"
          value={`${priceUp ? "+" : ""}${(r.priceChangeM5 ?? 0).toFixed(1)}%`}
          tone={priceUp ? "up" : "down"}
        />
      </div>

      {r.reasons && r.reasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {r.reasons.map((reason) => (
            <span
              key={reason}
              className="text-[11px] px-2 py-1 rounded-full bg-panel2 text-mute font-mono"
            >
              {reason}
            </span>
          ))}
        </div>
      )}

      {r.lowLiquidity && (
        <div className="text-[11px] text-down mt-3">نقدینگی کم — ریسک بالا</div>
      )}
    </a>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  const color = tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-ink";
  return (
    <div className="rounded-xl bg-panel2 py-2">
      <div className="text-[10px] text-mute mb-1">{label}</div>
      <div className={`font-mono text-sm font-semibold ${color}`}>{value}</div>
    </div>
  );
}
