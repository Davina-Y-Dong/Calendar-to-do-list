import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Followdesk · 个人工作台",
  description: "从邮件与网页中整理关键事项、待办和跟进记录。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
