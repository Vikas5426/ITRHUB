"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileJson,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

import { useAuth } from "@/components/AuthProvider";
import { apiRequest } from "@/lib/api";

type Profile = {
  id: number;
  display_name: string;
};

type Filing = {
  id: number;
  profile_id: number;
  assessment_year_start: number;
  itr_form: string | null;
  completion_percent: number;
};

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

const itrForms = ["ITR-1", "ITR-2", "ITR-3", "ITR-4", "ITR-5", "ITR-6", "ITR-7"];

function ayLabel(start: number) {
  return `AY ${start}-${String(start + 1).slice(-2)}`;
}

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

function statusClass(status: Schedule["status"]) {
  if (status === "ready") return "border-green-600/20 bg-green-600/10 text-green-700 dark:text-green-300";
  if (status === "needs_review") return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  if (status === "not_applicable") return "border-border bg-muted text-muted-foreground";
  return "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300";
}

function ReturnPreparationWorkbenchInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filings, setFilings] = useState<Filing[]>([]);
  const [activeFilingId, setActiveFilingId] = useState<number | null>(null);
  const [selectedItr, setSelectedItr] = useState("ITR-1");
  const [pack, setPack] = useState<ReturnPack | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const portalJson = useMemo(() => JSON.stringify(pack?.portal_json ?? {}, null, 2), [pack]);

  const loadPack = useCallback(async (filingId: number) => {
    const response = await apiRequest<ReturnPack>(`/api/workspace/filings/${filingId}/return-preparation`);
    setPack(response);
    setSelectedItr(response.itr_form);
  }, []);

  const loadBase = useCallback(async () => {
    try {
      const [profileData, filingData] = await Promise.all([
        apiRequest<Profile[]>("/api/workspace/profiles"),
        apiRequest<Filing[]>("/api/workspace/filings"),
      ]);
      setProfiles(profileData);
      setFilings(filingData);
      const requested = Number(searchParams.get("filing"));
      const selected = filingData.find((filing) => filing.id === requested) ?? filingData[0];
      setActiveFilingId(selected?.id ?? null);
      if (selected) await loadPack(selected.id);
    } catch (caught) {
      if (caught instanceof Error && caught.message === "Authentication required") {
        router.replace("/auth?mode=login");
      } else {
        setError(caught instanceof Error ? caught.message : "Unable to load return preparation");
      }
    }
  }, [loadPack, router, searchParams]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth?mode=login");
      return;
    }
    if (user) {
      const timer = window.setTimeout(() => void loadBase(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [authLoading, user, router, loadBase]);

  async function selectFiling(filingId: number) {
    setActiveFilingId(filingId);
    setError("");
    await loadPack(filingId);
  }

  async function generatePack() {
    if (!activeFilingId) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await apiRequest<ReturnPack>(
        `/api/workspace/filings/${activeFilingId}/return-preparation`,
        { method: "POST", body: JSON.stringify({ itr_form: selectedItr }) },
      );
      setPack(response);
      setSelectedItr(response.itr_form);
      setMessage(`Prepared ${response.itr_form} schedule pack with ${response.validations.length} validation item(s).`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to generate return preparation");
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
    link.download = `${pack.itr_form}-${pack.assessment_year}-itrhub-draft.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (authLoading || !user) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-5 pb-16 pt-28 lg:px-8">
      <header className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Return preparation engine</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Generate schedules before you file.</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Prepare ITR-1 through ITR-7 schedule packs, explain validation errors in plain English, estimate refund or self-assessment tax, and export draft portal JSON.
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert size={24} className="text-amber-600" />
            <div>
              <p className="font-black">Draft utility layer</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Export is portal-shaped for review. Final upload should be checked against the latest government utility schema.
              </p>
            </div>
          </div>
        </div>
      </header>

      {(error || message) && (
        <div className={`mb-6 rounded-2xl border p-4 text-sm font-semibold ${error ? "border-destructive/20 bg-destructive/10 text-destructive" : "border-green-600/20 bg-green-600/10 text-green-700 dark:text-green-400"}`}>
          {error || message}
          <button className="float-right" onClick={() => { setError(""); setMessage(""); }}>Dismiss</button>
        </div>
      )}

      {filings.length === 0 ? (
        <div className="minimal-card p-10 text-center">
          <ClipboardCheck className="mx-auto mb-4" size={42} />
          <h2 className="text-2xl font-black">Create a filing workspace first</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">Return preparation needs saved income sources and a filing workspace.</p>
          <Link href="/workspace" className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Open workspace</Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-4">
            <div className="minimal-card p-4">
              <h2 className="mb-4 px-2 font-black">Filing workspace</h2>
              <div className="space-y-2">
                {filings.map((filing) => {
                  const profile = profiles.find((item) => item.id === filing.profile_id);
                  return (
                    <button
                      key={filing.id}
                      onClick={() => void selectFiling(filing.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${activeFilingId === filing.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}
                    >
                      <p className="font-black">{ayLabel(filing.assessment_year_start)}</p>
                      <p className={`mt-1 text-xs ${activeFilingId === filing.id ? "opacity-70" : "text-muted-foreground"}`}>
                        {profile?.display_name ?? "Taxpayer"} - {filing.itr_form ?? "Form pending"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="minimal-card p-4">
              <label className="block text-sm font-bold">
                Target ITR form
                <select
                  value={selectedItr}
                  onChange={(event) => setSelectedItr(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-ring/20"
                >
                  {itrForms.map((form) => (
                    <option key={form} value={form}>{form}</option>
                  ))}
                </select>
              </label>
              <button
                onClick={() => void generatePack()}
                disabled={busy || !activeFilingId}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Generate pack
              </button>
              {pack && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Recommended by income wizard: <span className="font-black text-foreground">{pack.recommended_itr}</span>
                </p>
              )}
            </div>
          </aside>

          <div className="space-y-6">
            {pack ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard label="Taxable income" value={currency(pack.tax_summary.taxable_income)} />
                  <MetricCard label="Tax before credits" value={currency(pack.tax_summary.tax_before_credits)} />
                  <MetricCard label="Refund" value={currency(pack.tax_summary.refund)} tone="green" />
                  <MetricCard label="Total payable" value={currency(pack.tax_summary.total_payable)} tone={pack.tax_summary.total_payable > 0 ? "red" : "default"} />
                </div>

                <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
                  <div className="minimal-card p-6">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Schedules</p>
                        <h2 className="mt-1 text-2xl font-black">{pack.itr_form} schedule pack</h2>
                      </div>
                      <FileSpreadsheet />
                    </div>
                    <div className="grid gap-3">
                      {pack.schedules.map((schedule) => (
                        <details key={schedule.code} className="rounded-2xl border border-border bg-card p-4">
                          <summary className="cursor-pointer list-none">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-black">{schedule.name}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{schedule.code}</p>
                              </div>
                              <span className={`rounded-full border px-3 py-1 text-xs font-black capitalize ${statusClass(schedule.status)}`}>
                                {schedule.status.replaceAll("_", " ")}
                              </span>
                            </div>
                          </summary>
                          <div className="mt-4 grid gap-2">
                            {Object.entries(schedule.fields).map(([field, value]) => (
                              <div key={field} className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-3 text-sm">
                                <span className="font-bold">{labelFor(field)}</span>
                                <span className="text-right text-muted-foreground">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="minimal-card p-6">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Validation rules</p>
                      <h2 className="mt-1 text-2xl font-black">Plain-language review</h2>
                      <div className="mt-5 space-y-3">
                        {pack.validations.length === 0 ? (
                          <div className="flex gap-3 rounded-2xl border border-green-600/20 bg-green-600/10 p-4 text-sm font-semibold text-green-700 dark:text-green-300">
                            <CheckCircle2 size={18} />
                            No blocking validation issues in this draft pack.
                          </div>
                        ) : (
                          pack.validations.map((issue) => (
                            <div key={issue.code} className={`rounded-2xl border p-4 ${issue.severity === "error" ? "border-red-500/20 bg-red-500/10" : "border-amber-500/20 bg-amber-500/10"}`}>
                              <div className="mb-2 flex items-center gap-2 text-sm font-black">
                                <AlertTriangle size={16} />
                                {issue.code} - {issue.message}
                              </div>
                              <p className="text-sm text-muted-foreground">{issue.plain_language}</p>
                              <p className="mt-3 text-sm font-bold">Fix: {issue.suggested_fix}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="minimal-card p-6">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">234A/B/C and challan</p>
                      <h2 className="mt-1 text-2xl font-black">Payment guidance</h2>
                      <div className="mt-5 grid gap-2">
                        <Row label="234A interest" value={currency(pack.tax_summary.interest.section_234a)} />
                        <Row label="234B interest" value={currency(pack.tax_summary.interest.section_234b)} />
                        <Row label="234C interest" value={currency(pack.tax_summary.interest.section_234c)} />
                        <Row label="Challan amount" value={currency(pack.challan_guidance.amount)} />
                        <Row label="Minor head" value={pack.challan_guidance.minor_head} />
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground">{pack.challan_guidance.plain_language}</p>
                    </div>
                  </div>
                </div>

                <div className="minimal-card p-6">
                  <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Portal-compatible JSON</p>
                      <h2 className="mt-1 text-2xl font-black">Draft export</h2>
                    </div>
                    <button onClick={downloadJson} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">
                      <Download size={16} />
                      Download JSON
                    </button>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
                    <FileJson className="mt-0.5 shrink-0" size={18} />
                    <p>
                      This is a draft ITRHUB export shaped for portal review. Validate against the latest official utility before upload.
                    </p>
                  </div>
                  <pre className="mt-4 max-h-[420px] overflow-auto rounded-2xl bg-black p-4 text-xs text-white">
                    {portalJson}
                  </pre>
                </div>
              </>
            ) : (
              <div className="minimal-card p-10 text-center">
                <ClipboardCheck className="mx-auto mb-4" size={42} />
                <h2 className="text-2xl font-black">No preparation pack yet</h2>
                <p className="mt-2 text-muted-foreground">Generate a pack after saving income sources.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function MetricCard({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "green" | "red" }) {
  return (
    <div className={`rounded-3xl border p-5 ${tone === "green" ? "border-green-600/20 bg-green-600/10" : tone === "red" ? "border-red-500/20 bg-red-500/10" : "border-border bg-card"}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-3 text-sm">
      <span className="font-bold">{label}</span>
      <span className="text-right text-muted-foreground">{value}</span>
    </div>
  );
}

export function ReturnPreparationWorkbench() {
  return (
    <Suspense>
      <ReturnPreparationWorkbenchInner />
    </Suspense>
  );
}
