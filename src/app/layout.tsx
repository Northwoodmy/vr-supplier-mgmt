import type { Metadata } from "next";
import "./globals.css";
import { TRPCProvider } from "@/components/providers/trpc-provider";

export const metadata: Metadata = {
  title: "3D/VR 影片供应商管理系统",
  description: "高效管理供应商，精准评估产能，提升项目交付质量",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 font-sans">
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
