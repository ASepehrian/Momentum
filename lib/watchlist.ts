// این لیست رو با توکن‌های واقعی خودت پر کن.
// pairAddress رو از خود سایت dexscreener.com بگیر (نه آدرس قرارداد توکن،
// بلکه آدرس همون "جفت‌ارز/pool" که تو URL صفحه‌ی چارتش هست).
// chainId مثال: "ethereum", "bsc", "solana", "base", "kaspa" (هرچی DexScreener پشتیبانی کنه)

export type WatchlistItem = {
  label: string;
  chainId: string;
  pairAddress: string;
};

export const WATCHLIST: WatchlistItem[] = [
  // مثال — این‌ها رو پاک کن و جفت‌ارزهای واقعی خودتو جایگزین کن:
  // { label: "KAS/USDT", chainId: "kaspa", pairAddress: "0x..." },
];
