"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/agents", label: "AGENTS", icon: "👥" },
  { href: "/birdseye", label: "BIRD'S EYE", icon: "📹" },
  { href: "/war-room", label: "WAR ROOM", icon: "⚔️" },
  { href: "/comms", label: "COMMS", icon: "💬" },
  { href: "/missions", label: "MISSIONS", icon: "📋" },
  { href: "/system", label: "SYSTEM", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[200px] bg-bg-card border-r border-border-dim flex flex-col z-50">
      {/* Logo */}
      <div className="p-4 border-b border-border-dim">
        <h1 className="text-accent-green font-bold text-lg tracking-wider">CLAUDE GANK</h1>
        <p className="text-text-dim text-[10px] tracking-widest">COMMAND CENTER</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                isActive
                  ? "text-accent-green bg-accent-green/10 border-l-2 border-accent-green"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-card-hover"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border-dim">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent-green" />
          <span className="text-text-dim text-xs">SYSTEM v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
