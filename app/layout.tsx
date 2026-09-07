import type { Metadata } from "next";
import { PwaRegistration } from "@/components/PwaRegistration";
import { ThemeProvider } from "@/components/ThemeProvider";
import { THEME_INITIALIZER_SCRIPT } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Just Read · 英文阅读",
  description: "根据词汇熟悉度和阅读反馈，为你挑选英文文章的免费开源阅读器。",
  manifest: "/manifest.webmanifest",
  themeColor: "#F8F9FA",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon-192.png",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Just Read",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INITIALIZER_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <PwaRegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}
