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

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`DexScreener returned ${res.status}`);
  return res.json();
}

export async function fetchPair(
  chainId: string,
  pairAddress: string
): Promise<DexPair | null> {
  try {
    const data = (await getJson(`${BASE_URL}/pairs/${encodeURIComponent(chainId)}/${encodeURIComponent(pairAddress)}`)) as {
      pairs?: DexPair[];
      pair?: DexPair;
    };
    const pairs = data.pairs ?? (data.pair ? [data.pair] : []);
    return pairs[0] ?? null;
  } catch {
    return null;
  }
}

export async function searchBestPair(symbol: string): Promise<DexPair | null> {
  try {
    const data = (await getJson(`${BASE_URL}/search?q=${encodeURIComponent(symbol)}`)) as {
      pairs?: DexPair[];
    };
    const pairs = (data.pairs ?? []).filter(
      (pair) => pair.baseToken?.symbol?.toUpperCase() === symbol.toUpperCase()
    );
    return pairs.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0] ?? null;
  } catch {
    return null;
  }
}
