import type { MomentumResult } from "./momentum";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function esc(value: string) {
  return value.replace(/[\\_*\[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

function fmtUsd(n: number | null | undefined) {
  if (n == null) return "—";
  if (n < 0.01) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function fmtAccel(n: number | undefined) {
  if (n == null) return "—";
  if (n === Infinity) return "∞";
  return `${n.toFixed(1)}×`;
}

export function telegramConfigured() {
  return Boolean(BOT_TOKEN && CHAT_ID);
}

export async function sendMomentumAlert(result: MomentumResult) {
  if (!BOT_TOKEN || !CHAT_ID) return false;

  const lines = [
    "🚨 *ACTIVE MOMENTUM*",
    "",
    `*${esc(result.symbol)}* · ${esc(result.chainId)}`,
    result.altRank != null ? `AltRank: *#${result.altRank}*` : null,
    `Price: *${esc(fmtUsd(result.priceUsd))}*`,
    `5m: *${result.priceChangeM5 >= 0 ? "+" : ""}${result.priceChangeM5.toFixed(1)}%*`,
    `Volume accel: *${esc(fmtAccel(result.volumeAccel))}*`,
    `Buy accel: *${esc(fmtAccel(result.buyAccel))}*`,
    `Liquidity: *${esc(fmtUsd(result.liquidityUsd))}*`,
    result.reasons.length ? `Triggers: ${result.reasons.map(esc).join(", ")}` : null,
    result.url ? `\n[Open on DexScreener](${result.url})` : null,
  ].filter(Boolean).join("\n");

  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: lines,
      parse_mode: "MarkdownV2",
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Telegram returned ${response.status}: ${body.slice(0, 200)}`);
  }

  return true;
}
