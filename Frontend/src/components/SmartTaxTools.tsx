"use client";

import Link from "next/link";
import { ArrowRight, BellRing, ClipboardCheck, FileText, FolderOpen, Sparkles, ShieldCheck } from "lucide-react";
import { TaxRegimeComparison } from "./TaxRegimeComparison";

const nextSteps = [
  {
    href: "/intake",
    title: "Open Return Intake",
    text: "Add personal details, income streams, proof vault, and broker CAS files.",
    icon: FolderOpen,
    badge: "Step 1",
  },
  {
    href: "/analysis",
    title: "Launch Analysis Hub",
    text: "Live audit score, tax regime simulator, portfolio capital gains, and deduction audit.",
    icon: FileText,
    badge: "Step 2",
  },
  {
    href: "/track",
    title: "Track Deadlines & Status",
    text: "Monitor statutory due dates, delay exposure calculator, challans, and refund tracking.",
    icon: BellRing,
    badge: "Step 3",
  },
  {
    href: "/analysis?section=return",
    title: "Prepare & Export JSON",
    text: "Generate schedules, offline schema validation, challan guidance, and portal JSON.",
    icon: ClipboardCheck,
    badge: "Filing",
  },
];

export function SmartTaxTools() {
  return (
    <section id="tax-tools" className="py-24 px-6 lg:px-12 relative z-10 bg-muted/10 border-b border-border/40">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider mb-4 shadow-xs">
            <Sparkles size={14} />
            <span>Interactive Tax Intelligence</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black mb-3 leading-tight text-foreground tracking-tight">
            Smart Tax Tools & Simulator
          </h2>
          <p className="text-sm md:text-base text-muted-foreground font-medium max-w-2xl mx-auto">
            Test scenarios in real time with the AY 2026-27 decision engine, then seamlessly transition into Intake, Analysis, or Track.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_0.7fr] items-stretch">
          {/* Main Hero Regime Engine */}
          <TaxRegimeComparison />

          {/* Next Steps Card */}
          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 flex flex-col justify-between relative overflow-hidden group shadow-sm">
            <div className="absolute -bottom-20 -right-20 size-64 bg-primary/5 blur-[90px] rounded-full pointer-events-none" />
            
            <div className="relative z-10">
              <div className="mb-5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-2.5 py-0.5 rounded-full bg-muted">
                  Workflow Navigation
                </span>
                <h3 className="text-xl font-black text-foreground mt-2">Where to go next?</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Move directly into the dedicated workbench for your current filing stage.
                </p>
              </div>

              <div className="grid gap-3">
                {nextSteps.map((step) => (
                  <Link
                    key={step.href}
                    href={step.href}
                    className="group/step flex items-start gap-3.5 rounded-2xl border border-border/80 bg-muted/20 p-4 transition-all hover:border-primary hover:bg-muted/40 hover:-translate-y-0.5 shadow-xs"
                  >
                    <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 group-hover/step:bg-primary group-hover/step:text-primary-foreground transition-colors">
                      <step.icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="block text-xs font-black text-foreground">{step.title}</span>
                        <span className="text-[9px] font-black text-primary uppercase px-2 py-0.2 rounded-full bg-primary/10">
                          {step.badge}
                        </span>
                      </div>
                      <span className="mt-1 block text-[11px] text-muted-foreground leading-relaxed font-medium">
                        {step.text}
                      </span>
                    </div>
                    <ArrowRight size={14} className="mt-1 text-muted-foreground opacity-40 transition group-hover/step:translate-x-1 group-hover/step:opacity-100 shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="mt-6 p-4 rounded-2xl bg-muted/40 border border-border flex items-start gap-3 relative z-10 shadow-xs">
              <ShieldCheck className="text-primary shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-xs text-foreground font-black">Unified Filing Pipeline</p>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                  Inputs live in Intake, calculations compute in Analysis, and statutory dates sync in Track.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
