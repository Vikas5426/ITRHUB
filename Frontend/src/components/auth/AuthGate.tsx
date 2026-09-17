"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, CheckCircle2, Lock, ShieldCheck, Sparkles, UserPlus } from "lucide-react";

import { useAuth } from "@/components/AuthProvider";

type AuthGateProps = {
  children: ReactNode;
  featureTitle?: string;
  featureDescription?: string;
  highlights?: string[];
};

export function AuthGate({
  children,
  featureTitle = "Tax Feature",
  featureDescription = "Sign in or create a taxpayer account to access this tool, save calculations, and prepare your return.",
  highlights = [
    "Personalized AY 2026-27 tax liability calculation",
    "Encrypted data vault with auto-save across sessions",
    "Deterministic engine matching official income tax rules",
    "One-click sync with your tax return intake",
  ],
}: AuthGateProps) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="mx-auto my-12 max-w-4xl rounded-3xl border border-border/80 bg-card/60 p-12 text-center backdrop-blur-xl shadow-xs">
        <div className="mx-auto size-14 animate-pulse rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-4">
          <Sparkles className="size-6 animate-spin" />
        </div>
        <div className="mx-auto h-5 w-48 rounded-full bg-muted/60 animate-pulse mb-3" />
        <div className="mx-auto h-3 w-80 rounded-full bg-muted/40 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto my-8 max-w-3xl px-4">
        <div className="relative overflow-hidden rounded-3xl border border-border/90 bg-card/95 p-8 sm:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
          {/* Ambient Glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 size-72 rounded-full bg-primary/5 blur-3xl" />

          <div className="relative z-10 text-center">
            {/* Lock Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-primary shadow-xs mb-6">
              <Lock size={13} className="text-primary" />
              <span>Taxpayer Account Required</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              Unlock {featureTitle}
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base text-muted-foreground font-medium leading-relaxed">
              {featureDescription}
            </p>

            {/* Highlights List */}
            {highlights.length > 0 && (
              <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-border/70 bg-muted/30 p-5 text-left">
                <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-primary" />
                  What you get with your account
                </p>
                <ul className="space-y-2.5">
                  {highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2.5 text-xs sm:text-sm font-semibold text-foreground/90">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/auth?mode=login&next=${encodeURIComponent(pathname)}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-black text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Log In to Continue</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href={`/auth?mode=signup&next=${encodeURIComponent(pathname)}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-border bg-muted/40 hover:bg-muted px-7 py-3.5 text-sm font-bold text-foreground transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <UserPlus size={16} />
                <span>Create Free Account</span>
              </Link>
            </div>

            <p className="mt-6 text-[11px] text-muted-foreground font-medium">
              Free forever for individual taxpayers • Bank-grade AES-256 encryption • Zero spam
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
