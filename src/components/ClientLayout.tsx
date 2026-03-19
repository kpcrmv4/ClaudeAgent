"use client";

import { ThemeProvider, LangProvider } from "@/lib/context";
import { SpriteProvider } from "@/lib/sprites";
import { Sidebar } from "@/components/Sidebar";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LangProvider>
        <SpriteProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 lg:ml-[220px] p-4 sm:p-6 pt-16 lg:pt-6">
              {children}
            </main>
          </div>
        </SpriteProvider>
      </LangProvider>
    </ThemeProvider>
  );
}
