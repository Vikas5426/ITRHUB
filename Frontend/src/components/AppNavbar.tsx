"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Hexagon } from "lucide-react";

import { ThemeToggle } from "@/components/ThemeToggle";

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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 relative">
        <div className="flex items-center gap-3 shrink-0">
          {showBackButton && (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
              aria-label="Back to home"
            >
              <ArrowLeft size={14} />
              Back
            </Link>
          )}

          <Link href="/" className="flex items-center gap-2">
            <Hexagon className="text-primary" fill="currentColor" size={28} />
            <span className="text-xl font-black tracking-tight uppercase">ITRHUB</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center justify-center gap-8 text-sm font-semibold text-muted-foreground absolute left-1/2 -translate-x-1/2">
          {links.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "transition-colors",
                  isActive ? "text-primary" : "hover:text-primary",
                ].join(" ")}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <ThemeToggle />
          <button className="text-sm font-semibold hover:text-primary transition-colors">Log in</button>
          <button className="px-5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-bold shadow-md hover:bg-primary/90 transition-all">
            Sign up
          </button>
        </div>
      </div>
    </nav>
  );
}