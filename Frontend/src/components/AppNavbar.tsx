"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Hexagon } from "lucide-react";

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

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
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

        <div className="hidden min-w-0 flex-1 items-center justify-center gap-2 text-sm font-semibold text-muted-foreground lg:flex">
          {links.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "rounded-full px-3 py-2 transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted hover:text-foreground",
                ].join(" ")}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <ThemeToggle />
          {!loading && user ? (
            <>
              <div className="hidden text-sm font-semibold md:block">
                Hi, {user.full_name.split(' ')[0]}
              </div>
              <button 
                onClick={logout}
                className="text-sm font-semibold hover:text-primary transition-colors flex items-center gap-2"
              >
                Log out
              </button>
            </>
          ) : !loading && !user ? (
            <>
              <Link href="/auth?mode=login" className="text-sm font-semibold hover:text-primary transition-colors">Log in</Link>
              <Link href="/auth?mode=signup" className="px-5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-bold shadow-md hover:bg-primary/90 transition-all">
                Sign up
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
