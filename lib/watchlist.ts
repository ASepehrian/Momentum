// این لیست رو با توکن‌های واقعی خودت پر کن.
// pairAddress رو از خود سایت dexscreener.com بگیر (نه آدرس قرارداد توکن،
// بلکه آدرس همون "جفت‌ارز/pool" که تو URL صفحه‌ی چارتش هست).
// chainId مثال: "ethereum", "bsc", "solana", "base", ...

export type WatchlistItem = {
  label: string;
  chainId: string;
  pairAddress: string;
};

export const WATCHLIST: WatchlistItem[] = [
  // تأیید شده با جستجوی زنده (لینک‌ها رو خودت هم چک کن):
  { label: "ETH/USDC", chainId: "ethereum", pairAddress: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640" }, // Uniswap V3 0.3% — https://dexscreener.com/ethereum/0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640
  { label: "SOL/USDC", chainId: "solana", pairAddress: "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2" }, // Raydium — https://dexscreener.com/solana/58oqchx4ywmvkdwllzzbi4chocc2fqcuwbkwmihlyqo2

  // اینا رو خودت پر کن (پایین توضیح دادم چرا و چطور):
  // { label: "BTC/USDT", chainId: "ethereum", pairAddress: "0x..." },   // WBTC/USDT یا WBTC/WETH
  // { label: "PUMP/USDT", chainId: "solana", pairAddress: "0x..." },    // توکن pump.fun ($PUMP)
];
