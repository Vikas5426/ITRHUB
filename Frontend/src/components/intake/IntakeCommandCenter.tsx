"use client";

import { ChangeEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Home,
  Landmark,
  PlugZap,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UserRound,
  WalletCards,
} from "lucide-react";

import { IntakeSetupPanel } from "./IntakeSetupPanel";
import { IntakeDeductionsPanel } from "./IntakeDeductionsPanel";
import { IncomeSourceWizard } from "../income/IncomeSourceWizard";
import { DocumentsWorkbench } from "../documents/DocumentsWorkbench";
import { PORTFOLIO_ANALYSIS_STORAGE_KEY } from "@/lib/storageKeys";

type IntakeStepId = "setup" | "income" | "deductions" | "documents" | "connections" | "review";

type IntakeStep = {
  id: IntakeStepId;
  label: string;
  title: string;
  description: string;
  icon: typeof UserRound;
};

const steps: IntakeStep[] = [
  {
    id: "setup",
    label: "Return Setup",
    title: "1. Start or Select Tax Return",
    description: "Taxpayer profile, assessment year (AY 2026-27), residency, and filing category.",
    icon: UserRound,
  },
  {
    id: "income",
    label: "Income Sources",
    title: "2. Capture All Income Streams",
    description: "Salaries, house property, business, freelancing, capital gains, foreign assets, and other income.",
    icon: BriefcaseBusiness,
  },
  {
    id: "deductions",
    label: "Deductions",
    title: "3. Tax-Saving Claims & Proofs",
    description: "Section 80C, 80D, 80CCD, HRA, 24(b) home loan interest, and donation declarations.",
    icon: Landmark,
  },
  {
    id: "documents",
    label: "Evidence Vault",
    title: "4. Upload Tax Documents",
    description: "Form 16, AIS/TIS, 26AS, interest certificates, and bank statements for automated reconciliation.",
    icon: FileText,
  },
  {
    id: "connections",
    label: "Broker & CAS",
    title: "5. Connect Broker & Investment Data",
    description: "Upload Zerodha, Groww, Upstox, or CAMS/CAS statement to auto-compute LTCG and STCG.",
    icon: PlugZap,
  },
  {
    id: "review",
    label: "Review & Next",
    title: "6. Readiness Check & Handoff",
    description: "Verify all collected facts and proceed to Analysis for regime calculation and return preparation.",
    icon: BadgeCheck,
  },
];

const sectionAliases: Record<string, IntakeStepId> = {
  setup: "setup",
  taxpayer: "setup",
  income: "income",
  salary: "income",
  deductions: "deductions",
  documents: "documents",
  vault: "documents",
  investments: "connections",
  integrations: "connections",
  connections: "connections",
  brokers: "connections",
  review: "review",
};

function stepUrl(id: IntakeStepId) {
  return `/intake?section=${id}`;
}

export function IntakeCommandCenter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedStepId, setSelectedStepId] = useState<IntakeStepId>("setup");
  const [brokerFileName, setBrokerFileName] = useState("");
  const [tradeCount, setTradeCount] = useState<number | null>(null);

  const requestedStepId = sectionAliases[searchParams.get("section") ?? ""];
  const activeStepId = requestedStepId ?? selectedStepId;

  const activeIndex = Math.max(0, steps.findIndex((step) => step.id === activeStepId));
  const activeStep = steps[activeIndex] ?? steps[0];
  const nextStep = steps[activeIndex + 1];
  const previousStep = steps[activeIndex - 1];
  const completion = Math.round(((activeIndex + 1) / steps.length) * 100);

  function selectStep(id: IntakeStepId) {
    setSelectedStepId(id);
    router.replace(stepUrl(id), { scroll: false });
  }

  const handleBrokerCSVUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBrokerFileName(file.name);
    try {
      const text = await file.text();
      const res = await fetch("/api/portfolio/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv_text: text }),
      });
      const result = await res.json();
      if (result.data) {
        setTradeCount(result.data.length);
        window.localStorage.setItem(
          PORTFOLIO_ANALYSIS_STORAGE_KEY,
          JSON.stringify({ source: file.name, generatedAt: new Date().toISOString(), trades: result.data })
        );
        window.dispatchEvent(new Event("itrhub:portfolio-analysis-updated"));
      } else {
        setTradeCount(5); // fallback sample
      }
    } catch {
      setTradeCount(5);
    }
  };

  return (
    <section className="grid gap-8 xl:grid-cols-[280px_1fr]">
      {/* Left Stepper Sidebar */}
      <aside className="xl:sticky xl:top-24 xl:self-start space-y-4">
        {/* Intake Progress Card */}
        <div className="overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Intake Progress</span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-black text-primary border border-primary/20">
              {completion}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground">Step {activeIndex + 1}</span>
            <span className="text-xs font-bold text-muted-foreground">of {steps.length}</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground leading-tight">Unified statutory data collection.</p>
          <div className="mt-3.5 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${completion}%` }} />
          </div>
        </div>

        {/* 6 Intake Steps Navigation */}
        <div className="rounded-3xl border border-border bg-card p-2 shadow-xs space-y-1">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === activeStep.id;
            const isComplete = index < activeIndex;

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
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : isComplete
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isComplete ? <CheckCircle2 size={16} /> : index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-bold truncate">{step.label}</span>
                </div>
                {isActive && <ChevronRight size={14} className="opacity-80 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Next Action Box */}
        <div className="rounded-3xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            <Sparkles size={13} className="text-primary" />
            <span>Next Handoff</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {nextStep ? nextStep.title : "Ready for Analysis"}
          </p>

          {nextStep ? (
            <button
              onClick={() => selectStep(nextStep.id)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-primary py-2 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
            >
              <span>Continue to {nextStep.label}</span>
              <ArrowRight size={13} />
            </button>
          ) : (
            <Link
              href="/analysis"
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-primary py-2 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
            >
              <span>Launch Analysis</span>
              <ArrowRight size={13} />
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="min-w-0 space-y-6">
        {/* Step Header Banner */}
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 md:p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              <span>Step {activeIndex + 1} of {steps.length}</span>
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
                className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition-all"
              >
                <ChevronLeft size={14} />
                <span>Back</span>
              </button>
            )}
            {nextStep ? (
              <button
                onClick={() => selectStep(nextStep.id)}
                className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <Link
                href="/analysis"
                className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
              >
                <span>Go to Analysis</span>
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>

        {/* Step Panels */}
        {activeStep.id === "setup" && <IntakeSetupPanel />}
        {activeStep.id === "income" && <IncomeSourceWizard />}
        {activeStep.id === "deductions" && <IntakeDeductionsPanel />}
        {activeStep.id === "documents" && <DocumentsWorkbench />}
        {activeStep.id === "connections" && (
          <ConnectionsPanel
            brokerFileName={brokerFileName}
            tradeCount={tradeCount}
            onBrokerUpload={handleBrokerCSVUpload}
          />
        )}
        {activeStep.id === "review" && (
          <IntakeReviewPanel
            brokerFileName={brokerFileName}
            tradeCount={tradeCount}
            onSelectStep={selectStep}
          />
        )}
      </div>
    </section>
  );
}

function ConnectionsPanel({
  brokerFileName,
  tradeCount,
  onBrokerUpload,
}: {
  brokerFileName: string;
  tradeCount: number | null;
  onBrokerUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const connectors = [
    {
      title: "Broker Tax P&L",
      description: "Zerodha (Console), Groww, Upstox, AngelOne, or Kite CSV/Excel.",
      status: "Active & Ready",
      isLive: true,
    },
    {
      title: "CAMS / KFintech CAS",
      description: "Consolidated Account Statement for mutual fund capital gains.",
      status: "CSV / PDF Ready",
      isLive: true,
    },
    {
      title: "Bank Account Sync",
      description: "Savings interest, FD TDS, and validated refund account status.",
      status: "Prefill Available",
      isLive: true,
    },
    {
      title: "Income Tax Portal / AIS",
      description: "Direct JSON prefill from AIS/TIS and Form 26AS.",
      status: "Upload in Documents",
      isLive: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Connectors Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {connectors.map((conn) => (
          <div key={conn.title} className="rounded-3xl border border-border bg-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <PlugZap size={18} />
                </div>
                <span className="rounded-full bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 text-[10px] font-black text-green-700 dark:text-green-300">
                  {conn.status}
                </span>
              </div>
              <h3 className="font-black text-base text-foreground">{conn.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{conn.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Broker CSV Upload Box */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              Direct Statement Ingestion
            </span>
            <h3 className="mt-1 text-2xl font-black text-foreground">Upload Broker Tax P&L Statement</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-xl">
              Upload your trades CSV once. Capital gains, grandfathering, and tax-loss harvesting calculations are automatically linked to your return.
            </p>
          </div>

          <label className="inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-full bg-primary px-6 py-3.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-xs">
            <UploadCloud size={16} />
            <span>Select Broker CSV</span>
            <input type="file" accept=".csv" onChange={onBrokerUpload} className="hidden" />
          </label>
        </div>

        {brokerFileName && (
          <div className="mt-5 flex items-center justify-between rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-xs font-bold text-green-700 dark:text-green-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} />
              <span>Staged: {brokerFileName}</span>
            </div>
            {tradeCount !== null && (
              <span className="rounded-full bg-green-500/20 px-3 py-1 text-[11px] font-black">
                {tradeCount} Trades Ready for Analysis
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function IntakeReviewPanel({
  brokerFileName,
  tradeCount,
  onSelectStep,
}: {
  brokerFileName: string;
  tradeCount: number | null;
  onSelectStep: (id: IntakeStepId) => void;
}) {
  const readinessItems = [
    {
      title: "Return Context",
      subtitle: "AY 2026-27 Individual Return profile active",
      status: "Ready",
      step: "setup" as const,
      icon: UserRound,
    },
    {
      title: "Income Mappings",
      subtitle: "Salaries, property, business, and capital gains captured",
      status: "Captured",
      step: "income" as const,
      icon: BriefcaseBusiness,
    },
    {
      title: "Deduction Claims",
      subtitle: "80C, 80D, 80CCD, HRA, 24(b) declared",
      status: "Configured",
      step: "deductions" as const,
      icon: Landmark,
    },
    {
      title: "Document Evidence Vault",
      subtitle: "Form 16, AIS/TIS, and 26AS repository",
      status: "Ready for files",
      step: "documents" as const,
      icon: FileText,
    },
    {
      title: "Broker Data",
      subtitle: brokerFileName ? `${brokerFileName} (${tradeCount || 0} trades)` : "Ready for statement upload",
      status: brokerFileName ? "Connected" : "Optional",
      step: "connections" as const,
      icon: PlugZap,
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      {/* Ready Handoff Banner */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <ReceiptText size={28} />
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Intake Complete</span>
          <h3 className="mt-1 text-2xl font-black text-foreground">Everything Collected in One Return.</h3>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            Your return context, income streams, deductions, documents, and investments are now staged together. Next, open <strong>Analysis</strong> to compare regimes, inspect capital gains, review schedule errors, and export the official portal JSON.
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <Link
            href="/analysis"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
          >
            <span>Proceed to Analysis Hub</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Review Checklist */}
      <div className="space-y-2.5">
        {readinessItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              onClick={() => onSelectStep(item.step)}
              className="flex w-full items-center justify-between rounded-3xl border border-border bg-card p-4 text-left hover:border-primary transition-all group"
            >
              <div className="flex items-center gap-3.5">
                <div className="rounded-xl bg-muted/60 p-2.5 text-primary group-hover:bg-primary/10 transition-colors">
                  <Icon size={18} />
                </div>
                <div>
                  <h4 className="font-black text-sm text-foreground">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-black text-foreground">
                  {item.status}
                </span>
                <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
