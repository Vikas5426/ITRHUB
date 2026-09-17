"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Lock,
  PieChart,
  Radio,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";

export function ServiceGlimpses() {
  return (
    <section className="relative py-20 px-5 sm:px-8 lg:px-12 z-10 overflow-hidden bg-background">
      {/* Background Ambience */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 blur-[140px] rounded-full -z-10" />

      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider mb-4 shadow-xs">
            <Sparkles size={13} />
            <span>Core Tax Intelligence Services</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
            A glimpse into what powers <span className="text-primary">ITRHUB</span>.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground font-medium leading-relaxed">
            Our interactive calculation engines, portfolio analytics, and statutory compliance radars live in dedicated workbenches — secured for registered taxpayers.
          </p>
        </div>

        {/* 3 Main Service Glimpses */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 1. Tax Pulse Radar Glimpse */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs hover:border-primary/50 hover:shadow-md transition-all duration-300"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  <Radio size={12} className="animate-pulse text-blue-500" />
                  <span>Compliance Radar</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground/80">
                  <Lock size={12} />
                  <span>Sign In</span>
                </div>
              </div>

              <h3 className="text-2xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                Tax Pulse Radar
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                A live orbital compliance radar tracking AY 2026-27 advance tax tranches and statutory filing deadlines to eliminate Section 234 interest.
              </p>

              {/* Glimpse Preview Box */}
              <div className="mt-6 rounded-2xl border border-border/60 bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold pb-2 border-b border-border/40">
                  <span className="text-muted-foreground">Next Statutory Due Date</span>
                  <span className="text-blue-600 dark:text-blue-400">June 15, 2026</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">Advance Tax Q1 (15%)</span>
                  <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black text-emerald-600">On Track</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">ITR Filing Deadline</span>
                  <span className="text-xs font-bold text-muted-foreground">July 31, 2026</span>
                </div>
                <div className="pt-1 text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <ShieldAlert size={12} className="text-amber-500" />
                  <span>Sec 234C interest penalty exposure shield</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-border/40">
              <Link
                href="/pulse"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 hover:border-transparent py-3 px-4 text-xs font-black transition-all shadow-xs"
              >
                <span>Open Tax Pulse Radar</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>

          {/* 2. Portfolio Snap Glimpse */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs hover:border-primary/50 hover:shadow-md transition-all duration-300"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  <PieChart size={12} className="text-emerald-500" />
                  <span>Capital Gains</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground/80">
                  <Lock size={12} />
                  <span>Sign In</span>
                </div>
              </div>

              <h3 className="text-2xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                Portfolio Snap
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                Ingest multi-broker trade sheets (Zerodha, Groww, Upstox) to automatically compute STCG, LTCG, and grandfathering under revised Budget rules.
              </p>

              {/* Glimpse Preview Box */}
              <div className="mt-6 rounded-2xl border border-border/60 bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold pb-2 border-b border-border/40">
                  <span className="text-muted-foreground">Asset Allocation Preview</span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <TrendingUp size={12} /> +12.4% ROI
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span>Listed Equity</span>
                    <span className="text-muted-foreground">65% • LTCG @ 12.5%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden flex">
                    <div className="bg-primary h-full w-[65%]" />
                    <div className="bg-zinc-400 h-full w-[25%]" />
                    <div className="bg-zinc-600 h-full w-[10%]" />
                  </div>
                </div>
                <div className="pt-1 text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  <span>₹1.25L annual LTCG exemption auto-applied</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-border/40">
              <Link
                href="/portfolio"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 hover:border-transparent py-3 px-4 text-xs font-black transition-all shadow-xs"
              >
                <span>Explore Portfolio Snap</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>

          {/* 3. Smart Tax Tools & Simulator Glimpse */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs hover:border-primary/50 hover:shadow-md transition-all duration-300"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  <Zap size={12} className="text-purple-500" />
                  <span>Decision Engine</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground/80">
                  <Lock size={12} />
                  <span>Sign In</span>
                </div>
              </div>

              <h3 className="text-2xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                Tax Tools & Simulator
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                Deterministic calculation simulator comparing Old vs New tax regimes for AY 2026-27 with instant breakeven deduction guidance.
              </p>

              {/* Glimpse Preview Box */}
              <div className="mt-6 rounded-2xl border border-border/60 bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold pb-2 border-b border-border/40">
                  <span className="text-muted-foreground">AY 2026-27 Slabs</span>
                  <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-black text-purple-600">Enhanced ₹75k Std Ded</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-center">
                  <div className="rounded-xl border border-border/50 bg-background/80 p-2.5">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">New Regime</p>
                    <p className="font-black text-emerald-600 mt-0.5">Recommended</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background/80 p-2.5">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Old Regime</p>
                    <p className="font-black text-foreground mt-0.5">₹3.75L+ Deductions</p>
                  </div>
                </div>
                <div className="pt-1 text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  <span>Interactive 80C, 80D & HRA deduction explorer</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-border/40">
              <Link
                href="/simulator"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 hover:border-transparent py-3 px-4 text-xs font-black transition-all shadow-xs"
              >
                <span>Launch Tax Simulator</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Bottom Banner linking directly to Register/Login */}
        <div className="rounded-3xl border border-border bg-gradient-to-r from-primary/5 via-card to-primary/5 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary mb-2">
              <Sparkles size={14} />
              <span>Full Taxpayer Access</span>
            </div>
            <h3 className="text-2xl font-black text-foreground">
              Ready to calculate your exact AY 2026-27 tax liability?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
              Sign in or create an account in 30 seconds to run simulations, upload documents, and file.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/auth?mode=signup"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs sm:text-sm font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
            >
              <span>Get Started Free</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/auth?mode=login"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card hover:bg-muted px-6 py-3 text-xs sm:text-sm font-bold text-foreground transition-all shadow-xs"
            >
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
