import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "CLAUDE GANK — Command Center",
  description: "Multi-Agent AI Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-[200px] p-6">{children}</main>
      </body>
    </html>
  );
}
