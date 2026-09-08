import type { DexPair } from "./dexscreener";

export const THRESHOLDS = {
  minVolumeAccel: 3.0,
  minBuyAccel: 2.5,
  minAbsoluteLiquidityUsd: 20_000,
};

export type MomentumResult = {
  label: string;
  chainId: string;
  url: string;
  priceUsd: number | null;
  volumeAccel: number;
  buyAccel: number;
  liquidityUsd: number;
  priceChangeM5: number;
  priceChangeH1: number;
  reasons: string[];
  hit: boolean;
  lowLiquidity: boolean;
};

export function analyzePair(label: string, pair: DexPair): MomentumResult {
  const volM5 = pair.volume?.m5 ?? 0;
  const volH1 = pair.volume?.h1 ?? 0;
  const buysM5 = pair.txns?.m5?.buys ?? 0;
  const buysH1 = pair.txns?.h1?.buys ?? 0;
  const liquidityUsd = pair.liquidity?.usd ?? 0;
  const priceChangeM5 = pair.priceChange?.m5 ?? 0;
  const priceChangeH1 = pair.priceChange?.h1 ?? 0;

  const baselineVolPer5Min = volH1 > 0 ? volH1 / 12 : 0;
  const baselineBuysPer5Min = buysH1 > 0 ? buysH1 / 12 : 0;

  const volumeAccel =
    baselineVolPer5Min > 0 ? volM5 / baselineVolPer5Min : volM5 > 0 ? Infinity : 0;
  const buyAccel =
    baselineBuysPer5Min > 0 ? buysM5 / baselineBuysPer5Min : buysM5 > 0 ? Infinity : 0;

  const lowLiquidity = liquidityUsd < THRESHOLDS.minAbsoluteLiquidityUsd;

  const reasons: string[] = [];
  if (!lowLiquidity) {
    if (volumeAccel >= THRESHOLDS.minVolumeAccel) {
      reasons.push(`شتاب حجم ${volumeAccel === Infinity ? "∞" : volumeAccel.toFixed(1)}×`);
    }
    if (buyAccel >= THRESHOLDS.minBuyAccel) {
      reasons.push(`شتاب خرید ${buyAccel === Infinity ? "∞" : buyAccel.toFixed(1)}×`);
    }
    if (priceChangeM5 >= 3) {
      reasons.push(`رشد قیمت ۵دقیقه‌ای ${priceChangeM5.toFixed(1)}%`);
    }
  }

  return {
    label,
    chainId: pair.chainId,
    url: pair.url,
    priceUsd: pair.priceUsd ? parseFloat(pair.priceUsd) : null,
    volumeAccel,
    buyAccel,
    liquidityUsd,
    priceChangeM5,
    priceChangeH1,
    reasons,
    hit: !lowLiquidity && reasons.length >= 2,
    lowLiquidity,
  };
}
