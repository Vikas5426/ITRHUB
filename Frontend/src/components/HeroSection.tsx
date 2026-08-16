"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileCheck2,
  FolderOpen,
  PieChart,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";

export function HeroSection() {
  const [timeLeft, setTimeLeft] = useState({
    days: 45,
    hours: 12,
    minutes: 30,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date("2026-07-31T23:59:59").getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    };

    updateTimer();
    const timer = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const flowSteps = [
    {
      num: "01",
      title: "Intake Hub",
      subtitle: "Collect facts once",
      description: "Salaries, business, capital gains, Form 16, AIS, and broker files unified in one place.",
      badge: "One-Time Input",
      href: "/intake",
      icon: FolderOpen,
      color: "from-blue-500/10 to-indigo-500/10 border-blue-500/20",
    },
    {
      num: "02",
      title: "Analysis Center",
      subtitle: "Understand & optimize",
      description: "Old vs New regime comparison, loss harvesting, schedule validation, and portal JSON.",
      badge: "Real-Time AI",
      href: "/analysis",
      icon: BarChart3,
      color: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20",
    },
    {
      num: "03",
      title: "Track Everything",
      subtitle: "Deadlines & refunds",
      description: "Live countdown, advance tax alerts, Section 234F penalties, and filing status monitor.",
      badge: "Zero Surprises",
      href: "/track",
      icon: CalendarCheck,
      color: "from-amber-500/10 to-orange-500/10 border-amber-500/20",
    },
  ];

  return (
    <section
      className="relative flex flex-col items-center px-5 pb-24 pt-28 text-center sm:px-8 lg:px-12 overflow-hidden"
      suppressHydrationWarning
    >
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="z-10 max-w-5xl"
        suppressHydrationWarning
      >
        {/* Deadline Badge */}
        <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-semibold backdrop-blur-md shadow-xs">
          <Clock size={14} className="text-primary animate-pulse" />
          <span className="text-muted-foreground">AY 2026-27 ITR Deadline:</span>
          <span className="font-mono font-black text-foreground">
            {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="mb-6 text-5xl font-black leading-[0.95] tracking-tight text-foreground sm:text-7xl lg:text-8xl">
          FILE SMARTER.
          <br />
          <span className="bg-gradient-to-r from-foreground via-foreground/80 to-muted-foreground bg-clip-text text-transparent">
            SEE EVERYTHING.
          </span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-base font-medium text-muted-foreground sm:text-lg">
          The intelligent Indian tax platform. Input once in <strong className="text-foreground">Intake</strong>, review insights and schedules in <strong className="text-foreground">Analysis</strong>, and monitor every deadline in <strong className="text-foreground">Track</strong>.
        </p>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col items-center justify-center gap-3.5 sm:flex-row sm:flex-wrap mb-16">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/intake"
              className="flex items-center gap-2.5 rounded-full bg-primary px-8 py-4 text-base font-black text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              <span>Start Return Intake</span>
              <ArrowRight size={18} />
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/analysis"
              className="flex items-center gap-2 rounded-full border border-border bg-card/70 px-7 py-4 text-base font-bold text-foreground backdrop-blur-md shadow-xs hover:bg-muted transition-all"
            >
              <span>Explore Analysis</span>
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/track"
              className="flex items-center gap-2 rounded-full border border-border bg-card/70 px-7 py-4 text-base font-bold text-foreground backdrop-blur-md shadow-xs hover:bg-muted transition-all"
            >
              <span>Deadline Tracker</span>
            </Link>
          </motion.div>
        </div>

        {/* 3-Pillar Interactive Step Cards */}
        <div className="grid gap-4 sm:grid-cols-3 text-left">
          {flowSteps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
              >
                <Link
                  href={step.href}
                  className={`group relative flex flex-col justify-between rounded-3xl border bg-gradient-to-b ${step.color} p-6 backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-background text-foreground font-black text-xs shadow-xs border border-border">
                        {step.num}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-background/80 border border-border text-foreground">
                        {step.badge}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon size={18} className="text-primary" />
                      <h2 className="text-xl font-black text-foreground">{step.title}</h2>
                    </div>
                    <p className="text-xs font-bold text-muted-foreground mb-3">{step.subtitle}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>

                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-border/40 text-xs font-black text-foreground group-hover:text-primary transition-colors">
                    <span>Open stage</span>
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600 dark:text-green-400" />
            <span>ITR-1, 2, 3, 4 Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600 dark:text-green-400" />
            <span>Old vs New Regime Engine</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600 dark:text-green-400" />
            <span>Zerodha & Groww P&L Sync</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600 dark:text-green-400" />
            <span>Offline Schema Validations</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
