# Momentum Dashboard

مانیتور "Early Momentum" — از DexScreener API (رایگان) حجم و تعداد خرید on-chain رو
با شتاب (rate of change) می‌سنجه تا زودتر از سیگنال‌های اجتماعی (AltRank/Galaxy Score)
شروع رشد یه توکن رو تشخیص بده. صفحه‌ای که هر بار بازش کنی (از گوشی هم) زنده رفرش می‌شه.

## راه‌اندازی محلی

```bash
npm install
npm run dev
```

بعد `http://localhost:3000` رو باز کن.

## اضافه کردن توکن به واچ‌لیست

فایل `lib/watchlist.ts` رو باز کن و آیتم اضافه کن:

```ts
export const WATCHLIST: WatchlistItem[] = [
  { label: "KAS/USDT", chainId: "kaspa", pairAddress: "0xPAIR_ADDRESS" },
];
```

`pairAddress` رو از خود [dexscreener.com](https://dexscreener.com) بگیر: توکن مورد نظرت رو
سرچ کن، وارد صفحه‌ی چارتش شو، و آدرس pair (نه آدرس قرارداد توکن) از URL همون صفحه استخراج می‌شه.

## Deploy روی Vercel (از طریق GitHub)

1. یه ریپازیتوری جدید روی گیت‌هاب بساز و این پوشه رو push کن:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/USERNAME/momentum-dashboard.git
   git push -u origin main
   ```
2. برو [vercel.com](https://vercel.com) → **Add New Project** → ریپازیتوری رو انتخاب کن → **Deploy**.
   نیازی به تنظیم environment variable یا دیتابیس نیست؛ این نسخه کاملاً stateless
   هست (هر بار صفحه رو باز کنی، لحظه‌ای از DexScreener می‌گیره).
3. بعد از دیپلوی، لینک `*.vercel.app` رو باز کن یا به Home Screen گوشیت اضافه کن
   (Safari/Chrome → Share → Add to Home Screen) تا مثل یه اپ باز بشه.

## به‌روزرسانی واچ‌لیست بعد از دیپلوی

چون واچ‌لیست داخل کده (نه دیتابیس)، برای اضافه/حذف توکن باید:
```bash
# فایل lib/watchlist.ts رو ویرایش کن، بعد:
git add lib/watchlist.ts
git commit -m "Update watchlist"
git push
```
Vercel خودکار دوباره دیپلوی می‌کنه (چند ثانیه طول می‌کشه).

> اگه بعداً خواستی واچ‌لیست رو از خود اپ (بدون نیاز به push کردن کد) ویرایش کنی،
> باید یه دیتابیس ساده (مثل همون Supabase که پروژه‌ی دیگه‌ات ازش استفاده می‌کنه) اضافه کنیم.

## آستانه‌ها

داخل `lib/momentum.ts`:
- `minVolumeAccel`: حداقل نسبت شتاب حجم (پیش‌فرض ۳×)
- `minBuyAccel`: حداقل نسبت شتاب تعداد خرید (پیش‌فرض ۲.۵×)
- `minAbsoluteLiquidityUsd`: حداقل نقدینگی برای فیلتر امنیتی (پیش‌فرض $۲۰,۰۰۰)

## محدودیت‌ها

- فقط داده‌ی on-chain (DexScreener)؛ به بات LunarCrush/Gemini فعلیت وصل نیست — این یه لایه‌ی جدا و مکمله.
- بدون پرسیستنس؛ رشد لیکوییدیتی نسبت به گذشته حساب نمی‌شه (چون هر ریکوئست stateless هست).
- هیچ معامله‌ی خودکاری انجام نمی‌ده — فقط مشاهده و هشدار.
