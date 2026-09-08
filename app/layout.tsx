import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Momentum — Early Signal Monitor",
  description: "On-chain volume & buyer acceleration monitor, ahead of social signals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-sans bg-base text-ink antialiased">{children}</body>
    </html>
  );
}
