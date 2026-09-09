import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "مومنتوم — پایش شتاب آن‌چین",
  description: "پایش لحظه‌ای شتاب حجم و خرید توکن‌ها، پیش از سیگنال‌های اجتماعی.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0B0E14",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-sans bg-base text-ink antialiased">{children}</body>
    </html>
  );
}
