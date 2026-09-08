export type DexPair = {
  chainId: string;
  dexId: string;
  url: string;
  baseToken: { address: string; name: string; symbol: string };
  priceUsd?: string;
  txns?: {
    m5?: { buys: number; sells: number };
    h1?: { buys: number; sells: number };
    h6?: { buys: number; sells: number };
    h24?: { buys: number; sells: number };
  };
  volume?: { m5?: number; h1?: number; h6?: number; h24?: number };
  priceChange?: { m5?: number; h1?: number; h6?: number; h24?: number };
  liquidity?: { usd?: number; base?: number; quote?: number };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
};

const BASE_URL = "https://api.dexscreener.com/latest/dex";

export async function fetchPair(
  chainId: string,
  pairAddress: string
): Promise<DexPair | null> {
  const url = `${BASE_URL}/pairs/${chainId}/${pairAddress}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  const pairs: DexPair[] = data.pairs ?? (data.pair ? [data.pair] : []);
  return pairs[0] ?? null;
}
