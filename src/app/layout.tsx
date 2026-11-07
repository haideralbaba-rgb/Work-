import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Cairo, Inter } from "next/font/google";
import "./globals.css";

const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "INDEPENDENT OS — حوّل طموحك إلى شغل حقيقي",
  description:
    "منصة تنفيذ الأعمال الذكية لصانع المحتوى المستقل: استراتيجي أعمال، إدارة عملاء، سكربتات، وتتبع إيرادات حتى أول $2,000 محصّلة.",
};

export const viewport: Viewport = {
  themeColor: "#090909",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${inter.variable}`}>
      <body className="bg-ink text-fog antialiased">{children}</body>
    </html>
  );
}
