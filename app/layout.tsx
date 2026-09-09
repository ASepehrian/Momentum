import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Momentum — On-Chain Early Signals",
  description: "Real-time on-chain buying and volume acceleration before social buzz takes off.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#080B10",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className="font-sans bg-base text-ink antialiased">{children}</body>
    </html>
  );
}
