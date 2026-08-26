import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Just Read · 自适应英文阅读",
  description: "一个会逐渐了解你的兴趣和阅读难度的英文文章流。",
  manifest: "/manifest.webmanifest",
  themeColor: "#f5f1e8",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
