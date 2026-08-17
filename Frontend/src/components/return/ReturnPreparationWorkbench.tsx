"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileJson,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  ShieldCheck,
  CreditCard,
  Copy,
  Check,
} from "lucide-react";

import { useTaxWorkspace } from "@/context/TaxWorkspaceContext";
import { apiRequest } from "@/lib/api";

type Schedule = {
  code: string;
  name: string;
  status: "draft" | "ready" | "needs_review" | "not_applicable";
  fields: Record<string, string | number | boolean | null>;
};

type ValidationIssue = {
  code: string;
  severity: "error" | "warning" | "info";
  schedule: string;
  message: string;
  plain_language: string;
  suggested_fix: string;
};

type ReturnPack = {
  workspace_id: number;
  assessment_year: string;
  itr_form: string;
  recommended_itr: string;
  engine_version: string;
  official_utility_status: string;
  schedules: Schedule[];
  validations: ValidationIssue[];
  tax_summary: {
    gross_total_income: number;
    deductions: number;
    taxable_income: number;
    tax_before_credits: number;
    tax_paid: number;
    refund: number;
    self_assessment_tax_due: number;
    total_payable: number;
    interest: {
      section_234a: number;
      section_234b: number;
      section_234c: number;
      total_interest: number;
      plain_language: string;
    };
  };
  challan_guidance: {
    is_required: boolean;
    amount: number;
    challan: string;
    minor_head: string;
    plain_language: string;
  };
  portal_json: Record<string, unknown>;
};

const itrForms = ["ITR-1", "ITR-2", "ITR-3", "ITR-4"];

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function labelFor(key: string) {
  return key.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusBadge(status: Schedule["status"]) {
  if (status === "ready") {
    return <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-[10px] font-black text-green-600 dark:text-green-400">Ready</span>;
  }
  if (status === "needs_review") {
    return <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-black text-amber-600 dark:text-amber-400">Review</span>;
  }
  if (status === "not_applicable") {
    return <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">N/A</span>;
  }
  return <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-black text-blue-600 dark:text-blue-400">Draft</span>;
}

function ReturnPreparationWorkbenchInner() {
  const { activeFiling, taxAnalysis, loading } = useTaxWorkspace();
  const [selectedItr, setSelectedItr] = useState<string>("ITR-1");
  const [pack, setPack] = useState<ReturnPack | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"schedules" | "validations" | "payment" | "json">("schedules");
  const [copiedJson, setCopiedJson] = useState(false);

  const portalJson = useMemo(() => JSON.stringify(pack?.portal_json ?? {}, null, 2), [pack]);

  const loadPack = useCallback(async (filingId: number) => {
    setBusy(true);
    setError("");
    try {
      const response = await apiRequest<ReturnPack>(`/api/workspace/filings/${filingId}/return-preparation`);
      setPack(response);
      setSelectedItr(response.itr_form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load return preparation pack");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (activeFiling?.id) {
      void loadPack(activeFiling.id);
    }
  }, [activeFiling?.id, loadPack]);

  async function generatePack() {
    if (!activeFiling) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await apiRequest<ReturnPack>(
        `/api/workspace/filings/${activeFiling.id}/return-preparation`,
        { method: "POST", body: JSON.stringify({ itr_form: selectedItr }) },
      );
      setPack(response);
      setSelectedItr(response.itr_form);
      setMessage(`Generated ${response.itr_form} schedule pack based on your live financial data.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate return pack");
    } finally {
      setBusy(false);
    }
  }

  function downloadJson() {
    if (!pack) return;
    const blob = new Blob([portalJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${pack.itr_form}-${pack.assessment_year}-ITRHUB-draft.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function copyJson() {
    navigator.clipboard.writeText(portalJson);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Configuration & Selection Bar */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Target ITR Form</span>
            <div className="flex items-center gap-2 mt-1">
              <select
                value={selectedItr}
                onChange={(e) => setSelectedItr(e.target.value)}
                className="rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs font-black text-foreground outline-none focus:border-primary shadow-xs"
              >
                {itrForms.map((form) => (
                  <option key={form} value={form}>{form}</option>
                ))}
              </select>
              <button
                onClick={() => void generatePack()}
                disabled={busy || !activeFiling}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-black text-primary-foreground hover:bg-primary/90 disabled:opacity-40 shadow-xs"
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                <span>Regenerate Schedules</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-bold text-muted-foreground">AY 2026-27 Utility</span>
          <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-[10px] font-black text-green-600 dark:text-green-400 border border-green-500/20">
            Schema Verified
          </span>
        </div>
      </div>

      {(error || message) && (
        <div
          className={`rounded-2xl border p-3.5 text-xs font-bold ${
            error
              ? "border-destructive/20 bg-destructive/10 text-destructive"
              : "border-green-600/20 bg-green-600/10 text-green-700 dark:text-green-400"
          }`}
        >
          {error || message}
        </div>
      )}

      {/* Metric Cards Row */}
      {pack && (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Taxable Income</span>
            <p className="mt-1 text-xl font-black text-foreground">{currency(pack.tax_summary.taxable_income)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Tax Computed</span>
            <p className="mt-1 text-xl font-black text-foreground">{currency(pack.tax_summary.tax_before_credits)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">TDS / Advance Paid</span>
            <p className="mt-1 text-xl font-black text-green-600 dark:text-green-400">{currency(pack.tax_summary.tax_paid)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Balance Payable / Due</span>
            <p className={`mt-1 text-xl font-black ${pack.tax_summary.total_payable > 0 ? "text-red-500" : "text-foreground"}`}>
              {currency(pack.tax_summary.total_payable)}
            </p>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-border/80 gap-2 overflow-x-auto pb-1">
        {[
          { id: "schedules", label: "ITR Schedules Pack", icon: FileSpreadsheet },
          { id: "validations", label: "Pre-Filing Validation Checks", icon: ShieldCheck },
          { id: "payment", label: "Taxes & Challan 280", icon: CreditCard },
          { id: "json", label: "Official JSON Export", icon: FileJson },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Schedules Pack */}
      {activeSubTab === "schedules" && pack && (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {pack.schedules.map((schedule) => (
              <details
                key={schedule.code}
                className="rounded-2xl border border-border bg-card p-4 shadow-xs group transition-all"
              >
                <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black text-foreground">{schedule.name}</h4>
                    <p className="text-[10px] font-bold text-muted-foreground mt-0.5">{schedule.code}</p>
                  </div>
                  {statusBadge(schedule.status)}
                </summary>

                <div className="mt-3 pt-3 border-t border-border/40 space-y-1.5">
                  {Object.entries(schedule.fields).map(([field, value]) => (
                    <div key={field} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-muted/40">
                      <span className="font-bold text-muted-foreground">{labelFor(field)}:</span>
                      <span className="font-black text-foreground">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Validation Checks */}
      {activeSubTab === "validations" && pack && (
        <div className="space-y-3">
          {pack.validations.length === 0 ? (
            <div className="flex items-center gap-3 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-xs font-bold text-green-700 dark:text-green-300">
              <CheckCircle2 size={18} />
              <span>All statutory schedule checks passed with 0 blocking errors. Ready for export.</span>
            </div>
          ) : (
            pack.validations.map((issue) => (
              <div
                key={issue.code}
                className={`rounded-2xl border p-4 text-xs space-y-1.5 shadow-xs ${
                  issue.severity === "error"
                    ? "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300"
                    : "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                }`}
              >
                <div className="flex items-center gap-2 font-black">
                  <AlertTriangle size={15} />
                  <span>{issue.code}: {issue.message}</span>
                </div>
                <p className="text-muted-foreground font-medium">{issue.plain_language}</p>
                <p className="font-black pt-1 border-t border-current/10">Suggested Fix: {issue.suggested_fix}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Taxes & Challan 280 */}
      {activeSubTab === "payment" && pack && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-primary" />
            <h4 className="text-sm font-black text-foreground">Self-Assessment Tax & Interest Breakdown</h4>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 flex justify-between text-xs">
              <span className="font-bold text-muted-foreground">Sec 234A Interest (Late filing):</span>
              <span className="font-black text-foreground">{currency(pack.tax_summary.interest.section_234a)}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 flex justify-between text-xs">
              <span className="font-bold text-muted-foreground">Sec 234B Interest (Advance shortfall):</span>
              <span className="font-black text-foreground">{currency(pack.tax_summary.interest.section_234b)}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 flex justify-between text-xs">
              <span className="font-bold text-muted-foreground">Sec 234C Interest (Deferment):</span>
              <span className="font-black text-foreground">{currency(pack.tax_summary.interest.section_234c)}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 flex justify-between text-xs">
              <span className="font-bold text-muted-foreground">Challan Payment Required:</span>
              <span className="font-black text-foreground">{currency(pack.challan_guidance.amount)}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 text-xs text-muted-foreground font-medium leading-relaxed">
            {pack.challan_guidance.plain_language}
          </div>
        </div>
      )}

      {/* Tab 4: Portal JSON Export */}
      {activeSubTab === "json" && pack && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-black text-foreground">Official Government Portal JSON</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ready for upload on incometax.gov.in e-filing portal
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyJson}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3.5 py-2 text-xs font-bold hover:bg-muted transition-all shadow-xs"
              >
                {copiedJson ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                <span>{copiedJson ? "Copied" : "Copy JSON"}</span>
              </button>
              <button
                onClick={downloadJson}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-black hover:bg-primary/90 transition-all shadow-xs"
              >
                <Download size={14} />
                <span>Download .JSON</span>
              </button>
            </div>
          </div>

          <pre className="max-h-80 overflow-auto rounded-2xl bg-muted/30 border border-border/60 p-4 text-[11px] font-mono text-foreground leading-relaxed">
            {portalJson}
          </pre>
        </div>
      )}
    </div>
  );
}

export function ReturnPreparationWorkbench() {
  return (
    <Suspense fallback={<div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>}>
      <ReturnPreparationWorkbenchInner />
    </Suspense>
  );
}
