"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ChevronRight, FileSpreadsheet, Hexagon, Shield, Sparkles } from "lucide-react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/components/AuthProvider";

type NavLink = {
  href: string;
  label: string;
};

type AppNavbarProps = {
  links: NavLink[];
};

export function AppNavbar({ links }: AppNavbarProps) {
  const pathname = usePathname();
  const showBackButton = pathname !== "/";
  const { user, loading, logout } = useAuth();

  const isWorkflowRoute = ["/intake", "/analysis", "/track"].includes(pathname);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border/80 bg-background/85 px-4 py-3 backdrop-blur-xl sm:px-6 shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Brand & Back Button */}
        <div className="flex items-center gap-3 shrink-0">
          {showBackButton && (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:border-primary hover:text-primary"
              aria-label="Back to home"
            >
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">Home</span>
            </Link>
          )}

          <Link href="/" className="flex items-center gap-2 group">
            <div className="size-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
              <Hexagon className="text-primary-foreground" fill="currentColor" size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight uppercase leading-none">ITRHUB</span>
              <span className="text-[10px] font-bold text-muted-foreground tracking-wider">AY 2026-27</span>
            </div>
          </Link>
        </div>

        {/* 3-Pillar Guided Nav */}
        <div className="hidden min-w-0 flex-1 items-center justify-center gap-1.5 md:flex">
          <div className="flex items-center rounded-full border border-border/60 bg-muted/40 p-1 backdrop-blur-md">
            {links.map((link, idx) => {
              const isActive = pathname === link.href;

              return (
                <div key={link.href} className="flex items-center">
                  <Link
                    href={link.href}
                    className={[
                      "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition-all",
                      isActive
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                    ].join(" ")}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="size-2 rounded-full" style={{ backgroundColor: isActive ? "var(--primary)" : "currentColor", opacity: isActive ? 1 : 0.4 }} />
                    {link.label}
                  </Link>
                  {idx < links.length - 1 && (
                    <ChevronRight size={12} className="text-muted-foreground/30 mx-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Auth & Actions */}
        <div className="flex shrink-0 items-center gap-2.5 sm:gap-3.5">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/60 bg-muted/30 text-[11px] font-bold text-muted-foreground">
            <Shield size={12} className="text-green-600 dark:text-green-400" />
            <span>256-bit Encrypted</span>
          </div>

          <ThemeToggle />

          {!loading && user ? (
            <div className="flex items-center gap-3">
              <div className="hidden text-xs font-bold md:block text-muted-foreground">
                Hi, <span className="text-foreground">{user.full_name.split(' ')[0]}</span>
              </div>
              <button 
                onClick={logout}
                className="rounded-full border border-border px-3.5 py-1.5 text-xs font-bold hover:bg-muted hover:text-destructive transition-all"
              >
                Log out
              </button>
            </div>
          ) : !loading && !user ? (
            <div className="flex items-center gap-2">
              <Link href="/auth?mode=login" className="text-xs font-bold hover:text-primary transition-colors px-3 py-1.5">
                Log in
              </Link>
              <Link href="/auth?mode=signup" className="px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-xs font-bold shadow-xs hover:bg-primary/90 transition-all flex items-center gap-1.5">
                <Sparkles size={12} />
                <span>Get Started</span>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
