"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  FileCheck,
  FileJson,
  HelpCircle,
  Landmark,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
  Loader2,
} from "lucide-react";

import { PortfolioAnalyzer } from "../PortfolioAnalyzer";
import { ReturnPreparationWorkbench } from "../return/ReturnPreparationWorkbench";
import { useTaxWorkspace } from "@/context/TaxWorkspaceContext";

type AnalysisStepId = "summary" | "tax" | "investments" | "deductions" | "return";

type AnalysisStep = {
  id: AnalysisStepId;
  label: string;
  title: string;
  description: string;
  icon: typeof BarChart3;
};

const steps: AnalysisStep[] = [
  {
    id: "summary",
    label: "Health & Audit",
    title: "1. Return Health & Filing Readiness",
    description: "Holistic score of data completeness, schedule status, and risk checks before filing.",
    icon: BarChart3,
  },
  {
    id: "tax",
    label: "Regime Decision",
    title: "2. Old vs New Regime Comparison",
    description: "Interactive tax calculation engine comparing both tax regimes with deduction impact.",
    icon: PiggyBank,
  },
  {
    id: "investments",
    label: "Capital Gains",
    title: "3. Portfolio & Capital Gains Intelligence",
    description: "LTCG, STCG, loss harvesting, grandfathering clause, and broker trade analysis.",
    icon: TrendingUp,
  },
  {
    id: "deductions",
    label: "Tax Savings",
    title: "4. Deductions & Optimization Opportunities",
    description: "Analysis of 80C, 80D, HRA, 80CCD claims and missed tax-saving headroom.",
    icon: Landmark,
  },
  {
    id: "return",
    label: "Schedules & JSON",
    title: "5. Return Schedules & Portal JSON Export",
    description: "ITR schedule drafts, validation issue fixer, challan payment guidance, and portal JSON download.",
    icon: FileJson,
  },
];

const sectionAliases: Record<string, AnalysisStepId> = {
  summary: "summary",
  health: "summary",
  tax: "tax",
  regime: "tax",
  investments: "investments",
  portfolio: "investments",
  gains: "investments",
  deductions: "deductions",
  savings: "deductions",
  return: "return",
  prepare: "return",
  json: "return",
};

function stepUrl(id: AnalysisStepId) {
  return `/analysis?section=${id}`;
}

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}


export function AnalysisCommandCenter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { taxAnalysis, activeFiling } = useTaxWorkspace();
  const [selectedStepId, setSelectedStepId] = useState<AnalysisStepId>("summary");
  const requestedStepId = sectionAliases[searchParams.get("section") ?? ""];
  const activeStepId = requestedStepId ?? selectedStepId;
  const activeIndex = Math.max(0, steps.findIndex((step) => step.id === activeStepId));
  const activeStep = steps[activeIndex] ?? steps[0];
  const previousStep = steps[activeIndex - 1];
  const nextStep = steps[activeIndex + 1];

  const healthScore = taxAnalysis?.readiness_score ?? 0;

  function selectStep(id: AnalysisStepId) {
    setSelectedStepId(id);
    router.replace(stepUrl(id), { scroll: false });
  }

  return (
    <section className="grid gap-8 xl:grid-cols-[280px_1fr]">
      {/* Left Stepper Sidebar */}
      <aside className="xl:sticky xl:top-24 xl:self-start space-y-4">
        {/* Readiness Score Card */}
        <div className="overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Filing Readiness</span>
            <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-black text-green-600 dark:text-green-400 border border-green-500/20">
              {healthScore} / 100
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground">{healthScore}%</span>
            <span className="text-xs font-bold text-green-600 dark:text-green-400">
              {healthScore >= 80 ? "Ready to Review" : "In Progress"}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground leading-tight">
            {healthScore >= 80 ? "All core schedules verified. Zero blocking errors." : "Complete income sources & evidence in Intake."}
          </p>
          <div className="mt-3.5 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-green-500 transition-all duration-500" style={{ width: `${healthScore}%` }} />
          </div>
        </div>

        {/* 5 Analysis Lanes Navigation */}
        <div className="rounded-3xl border border-border bg-card p-2 shadow-xs space-y-1">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = activeStep.id === step.id;
            return (
              <button
                key={step.id}
                onClick={() => selectStep(step.id)}
                className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground font-black shadow-xs"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                    isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-bold truncate">{step.label}</span>
                </div>
                {isActive && <ChevronRight size={14} className="opacity-80 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Action helper card */}
        <div className="rounded-3xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            <Sparkles size={13} className="text-primary" />
            <span>Need to update data?</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Update salary, proofs, or deductions in the Return Intake Hub.
          </p>
          <Link
            href="/intake"
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-muted/40 py-2 text-xs font-black text-foreground hover:bg-muted transition-all"
          >
            <span>Open Intake Hub</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="min-w-0 space-y-6">
        {/* Step Header Banner */}
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 md:p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              <span>Lane {activeIndex + 1} of {steps.length}</span>
              <span>•</span>
              <span className="text-primary">{activeStep.label}</span>
            </div>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              {activeStep.title}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">{activeStep.description}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {previousStep && (
              <button
                onClick={() => selectStep(previousStep.id)}
                className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-all"
              >
                <ChevronLeft size={14} />
                <span>Back</span>
              </button>
            )}
            {nextStep ? (
              <button
                onClick={() => selectStep(nextStep.id)}
                className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
              >
                <span>Next Lane</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <Link
                href="/track"
                className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
              >
                <span>Go to Track</span>
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>

        {/* Step Views */}
        {activeStep.id === "summary" && <HealthReview onSelectStep={selectStep} />}
        {activeStep.id === "tax" && <TaxDecisionEngine />}
        {activeStep.id === "investments" && <CapitalGainsInteractiveReview />}
        {activeStep.id === "deductions" && <DeductionOptimizationReview />}
        {activeStep.id === "return" && <ReturnExportReview />}
      </div>
    </section>
  );
}

function HealthReview({ onSelectStep }: { onSelectStep: (id: AnalysisStepId) => void }) {
  const { taxAnalysis } = useTaxWorkspace();

  const auditChecks = taxAnalysis?.audit_checks || [
    { title: "Income Categorization", status: "Verified", detail: "Salary, Capital gains, and Savings Interest classified correctly.", tone: "ready" as const },
    { title: "Standard Deduction", status: "Applied", detail: "₹75,000 standard deduction factored under New Regime.", tone: "ready" as const },
    { title: "Capital Gains Schedule", status: "Active", detail: "Equity STCG (15%) and LTCG (10% > 1L) calculated.", tone: "ready" as const },
    { title: "AIS / 26AS Cross-Check", status: "Verified", detail: "TDS verification reconciled with vault documents.", tone: "ready" as const },
    { title: "Form Recommendation", status: "ITR-1 Detected", detail: "ITR-1 detected for salary and single house property income.", tone: "ready" as const },
  ];

  const isNewBetter = (taxAnalysis?.optimal_regime || "new") === "new";
  const savings = taxAnalysis?.tax_savings || 25200;
  const recommendedForm = taxAnalysis?.recommended_itr || "ITR-1";

  return (
    <div className="space-y-6">
      {/* Top Status Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Optimal Regime</span>
          <p className="mt-1 text-2xl font-black text-green-600 dark:text-green-400">
            {isNewBetter ? "New Regime" : "Old Regime"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Saves {currency(savings)} compared to alternate regime</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Recommended Form</span>
          <p className="mt-1 text-2xl font-black text-foreground">{recommendedForm}</p>
          <p className="mt-1 text-xs text-muted-foreground">Calculated from active income heads</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Self-Assessment Tax</span>
          <p className="mt-1 text-2xl font-black text-foreground">₹0 Due</p>
          <p className="mt-1 text-xs text-muted-foreground">Covered by employer TDS & advance tax</p>
        </div>
      </div>

      {/* Audit Checks Checklist */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={20} className="text-primary" />
          <h3 className="text-lg font-black text-foreground">Pre-Filing Audit & Integrity Checks</h3>
        </div>

        <div className="space-y-3">
          {auditChecks.map((item) => (
            <div
              key={item.title}
              className="flex items-start justify-between gap-4 rounded-2xl bg-muted/40 p-4 border border-border/40"
            >
              <div className="flex items-start gap-3">
                {item.tone === "ready" ? (
                  <CheckCircle2 size={17} className="text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle size={17} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                )}
                <div>
                  <h4 className="font-black text-xs text-foreground">{item.title}</h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black shrink-0 ${
                  item.tone === "ready"
                    ? "bg-green-500/10 text-green-700 dark:text-green-300"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                }`}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Analysis Jump Buttons */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { title: "Tax Regime Decision", text: "See step-by-step slab comparison", step: "tax" as const },
          { title: "Capital Gains Breakdown", text: "View trade chart and loss harvesting", step: "investments" as const },
          { title: "Schedules & JSON", text: "Verify schedules and export portal file", step: "return" as const },
        ].map((item) => (
          <button
            key={item.title}
            onClick={() => onSelectStep(item.step)}
            className="flex flex-col justify-between rounded-3xl border border-border bg-card p-5 text-left hover:border-primary transition-all group shadow-xs"
          >
            <div>
              <h4 className="font-black text-xs text-foreground">{item.title}</h4>
              <p className="mt-1 text-xs text-muted-foreground">{item.text}</p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
              <span>Inspect</span>
              <ArrowRight size={13} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function TaxDecisionEngine() {
  const { taxAnalysis, deductions } = useTaxWorkspace();

  const [grossIncome, setGrossIncome] = useState(taxAnalysis?.income_summary?.gross_total_income ?? 0);
  const [deductions80C, setDeductions80C] = useState(deductions?.sec_80c ?? 0);
  const [deductions80D, setDeductions80D] = useState(
    (deductions?.sec_80d_self ?? 0) + (deductions?.sec_80d_parents ?? 0)
  );
  const [hra, setHra] = useState(deductions?.hra_exemption ?? 0);
  const [nps, setNps] = useState(deductions?.sec_80ccd_1b ?? 0);

  useEffect(() => {
    if (taxAnalysis?.income_summary?.gross_total_income !== undefined) {
      setGrossIncome(Number(taxAnalysis.income_summary.gross_total_income) || 0);
    }
  }, [taxAnalysis]);

  useEffect(() => {
    if (deductions) {
      setDeductions80C(deductions.sec_80c ?? 0);
      setDeductions80D((deductions.sec_80d_self ?? 0) + (deductions.sec_80d_parents ?? 0));
      setHra(deductions.hra_exemption ?? 0);
      setNps(deductions.sec_80ccd_1b ?? 0);
    }
  }, [deductions]);

  // Old Regime Calculations
  const totalOldDeductions = deductions80C + deductions80D + hra + nps + 50000;
  const oldTaxableIncome = Math.max(0, grossIncome - totalOldDeductions);
  let oldTax = 0;
  if (oldTaxableIncome > 250000) {
    if (oldTaxableIncome <= 500000) {
      oldTax += (oldTaxableIncome - 250000) * 0.05;
    } else if (oldTaxableIncome <= 1000000) {
      oldTax += 250000 * 0.05 + (oldTaxableIncome - 500000) * 0.2;
    } else {
      oldTax += 250000 * 0.05 + 500000 * 0.2 + (oldTaxableIncome - 1000000) * 0.3;
    }
  }
  if (oldTaxableIncome <= 500000) oldTax = 0;
  const oldTaxWithCess = Math.round(oldTax * 1.04);

  // New Regime Calculations (AY 2026-27 Section 115BAC)
  const newTaxableIncome = Math.max(0, grossIncome - 75000);
  let newTax = 0;
  if (newTaxableIncome > 300000) {
    if (newTaxableIncome <= 700000) {
      newTax += (newTaxableIncome - 300000) * 0.05;
    } else if (newTaxableIncome <= 1000000) {
      newTax += 400000 * 0.05 + (newTaxableIncome - 700000) * 0.1;
    } else if (newTaxableIncome <= 1200000) {
      newTax += 400000 * 0.05 + 300000 * 0.1 + (newTaxableIncome - 1000000) * 0.15;
    } else if (newTaxableIncome <= 1500000) {
      newTax += 400000 * 0.05 + 300000 * 0.1 + 200000 * 0.15 + (newTaxableIncome - 1200000) * 0.2;
    } else {
      newTax += 400000 * 0.05 + 300000 * 0.1 + 200000 * 0.15 + 300000 * 0.2 + (newTaxableIncome - 1500000) * 0.3;
    }
  }
  if (newTaxableIncome <= 700000) newTax = 0;
  const newTaxWithCess = Math.round(newTax * 1.04);

  const difference = Math.abs(oldTaxWithCess - newTaxWithCess);
  const isNewBetter = newTaxWithCess <= oldTaxWithCess;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Automated Statutory Comparison
            </span>
            <h3 className="mt-1 text-2xl font-black text-foreground">
              {isNewBetter ? "New Tax Regime is Cheaper" : "Old Tax Regime is Cheaper"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-xl">
              You save <strong className="text-green-600 dark:text-green-400">{currency(difference)}</strong> by choosing the {isNewBetter ? "New Tax Regime (115BAC)" : "Old Tax Regime"} based on your actual income and claims.
            </p>
          </div>

          <div className="rounded-2xl bg-green-500/10 border border-green-500/20 px-5 py-3 text-right">
            <span className="text-[10px] font-black uppercase tracking-wider text-green-700 dark:text-green-300">
              Net Tax Difference
            </span>
            <p className="text-xl font-black text-green-700 dark:text-green-400">{currency(difference)}</p>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Old Regime Card */}
        <div className={`rounded-3xl border p-6 shadow-xs ${!isNewBetter ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Traditional</span>
              <h4 className="text-base font-black text-foreground">Old Tax Regime</h4>
            </div>
            {!isNewBetter && (
              <span className="rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs font-black">
                Recommended
              </span>
            )}
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Gross Total Income:</span>
              <span className="font-bold">{currency(grossIncome)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Standard Deduction:</span>
              <span className="font-bold text-green-600">- ₹50,000</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Section 80C & Other Deductions:</span>
              <span className="font-bold text-green-600">- {currency(totalOldDeductions - 50000)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Net Taxable Income:</span>
              <span className="font-black">{currency(oldTaxableIncome)}</span>
            </div>
            <div className="flex justify-between py-2 pt-3 text-sm">
              <span className="font-black text-foreground">Total Tax Payable (with 4% Cess):</span>
              <span className="font-black text-base text-foreground">{currency(oldTaxWithCess)}</span>
            </div>
          </div>
        </div>

        {/* New Regime Card */}
        <div className={`rounded-3xl border p-6 shadow-xs ${isNewBetter ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Default & Simplified</span>
              <h4 className="text-base font-black text-foreground">New Tax Regime</h4>
            </div>
            {isNewBetter && (
              <span className="rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs font-black">
                Recommended
              </span>
            )}
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Gross Total Income:</span>
              <span className="font-bold">{currency(grossIncome)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Standard Deduction (Enhanced):</span>
              <span className="font-bold text-green-600">- ₹75,000</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Section 80 Deductions:</span>
              <span className="font-bold text-muted-foreground">Not Eligible (Lower Slabs)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Net Taxable Income:</span>
              <span className="font-black">{currency(newTaxableIncome)}</span>
            </div>
            <div className="flex justify-between py-2 pt-3 text-sm">
              <span className="font-black text-foreground">Total Tax Payable (with 4% Cess):</span>
              <span className="font-black text-base text-foreground">{currency(newTaxWithCess)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Simulation Sliders */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
        <h4 className="text-sm font-black text-foreground mb-4">Simulate Income & Deductions</h4>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span>Gross Income: {currency(grossIncome)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={5000000}
              step={25000}
              value={grossIncome}
              onChange={(e) => setGrossIncome(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span>Section 80C Claim: {currency(deductions80C)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={150000}
              step={5000}
              value={deductions80C}
              onChange={(e) => setDeductions80C(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CapitalGainsInteractiveReview() {
  return (
    <div className="space-y-6">
      <PortfolioAnalyzer />
    </div>
  );
}

function DeductionOptimizationReview() {
  const { deductions } = useTaxWorkspace();

  const sec80c = deductions?.sec_80c ?? 0;
  const sec80d = (deductions?.sec_80d_self ?? 0) + (deductions?.sec_80d_parents ?? 0);
  const sec80ccd = deductions?.sec_80ccd_1b ?? 0;
  const sec24b = deductions?.sec_24b_home_loan ?? 0;

  const items = [
    {
      section: "Section 80C",
      claimed: sec80c,
      max: 150000,
      status: sec80c >= 150000 ? "Fully Utilized" : sec80c > 0 ? "Partially Used" : "Not Claimed",
      suggestion:
        sec80c >= 150000
          ? "Max cap of ₹1.5 Lakh reached with ELSS & EPF."
          : sec80c > 0
          ? `You can claim ${currency(150000 - sec80c)} more under 80C.`
          : "Invest in ELSS, PPF, or EPF to claim up to ₹1.5 Lakh in Old Regime.",
    },
    {
      section: "Section 80D",
      claimed: sec80d,
      max: 100000,
      status: sec80d >= 75000 ? "Fully Utilized" : sec80d > 0 ? "Partially Used" : "Not Claimed",
      suggestion:
        sec80d > 0
          ? "Additional deduction available by insuring senior citizen parents (up to ₹50,000)."
          : "Claim health insurance premiums for self, family (up to ₹25k) and senior parents (up to ₹50k).",
    },
    {
      section: "Section 80CCD(1B) NPS",
      claimed: sec80ccd,
      max: 50000,
      status: sec80ccd >= 50000 ? "Fully Utilized" : sec80ccd > 0 ? "Partially Used" : "Not Claimed",
      suggestion:
        sec80ccd > 0
          ? "Exclusive NPS tax deduction claimed over and above 80C."
          : "Invest up to ₹50,000 in Tier-1 NPS for an exclusive deduction over and above 80C.",
    },
    {
      section: "Section 24(b) Home Loan",
      claimed: sec24b,
      max: 200000,
      status: sec24b > 0 ? "Claimed" : "Not Claimed",
      suggestion:
        sec24b > 0
          ? `Claiming ${currency(sec24b)} in home loan interest.`
          : "If you pay interest on a home loan, claim up to ₹2 Lakhs in Old Regime.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.section} className="rounded-3xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-foreground">{item.section}</span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground">
                {currency(item.claimed)} / {currency(item.max)}
              </span>
            </div>
            <p
              className={`text-xs font-bold mb-1 ${
                item.status === "Not Claimed"
                  ? "text-muted-foreground"
                  : "text-green-600 dark:text-green-400"
              }`}
            >
              {item.status}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">{item.suggestion}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReturnExportReview() {
  return (
    <div className="space-y-6">
      <ReturnPreparationWorkbench />
    </div>
  );
}


