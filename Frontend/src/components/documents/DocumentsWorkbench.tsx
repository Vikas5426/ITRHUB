"use client";

import Link from "next/link";
import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSearch,
  FileText,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
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
};

type TaxDocument = {
  id: number;
  workspace_id: number;
  category: string;
  original_name: string;
  content_type: string;
  size_bytes: number;
  uploaded_at: string;
};

type ReconciliationReport = {
  workspace_id: number;
  generated_at: string;
  documents_reviewed: Array<Record<string, string | number>>;
  totals: Record<string, number>;
  items: Array<Record<string, string | number>>;
  findings: Array<{ severity: string; message: string }>;
  action_items: string[];
};

function ayLabel(start: number) {
  return `AY ${start}-${String(start + 1).slice(-2)}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function labelFor(category: string) {
  return category.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function DocumentsWorkbenchInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filings, setFilings] = useState<Filing[]>([]);
  const [documents, setDocuments] = useState<TaxDocument[]>([]);
  const [report, setReport] = useState<ReconciliationReport | null>(null);
  const [activeFilingId, setActiveFilingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const activeFiling = filings.find((filing) => filing.id === activeFilingId);
  const activeProfile = profiles.find((profile) => profile.id === activeFiling?.profile_id);

  const loadDocuments = useCallback(async (filingId: number) => {
    const [docs, latestReport] = await Promise.all([
      apiRequest<TaxDocument[]>(`/api/workspace/filings/${filingId}/documents`),
      apiRequest<ReconciliationReport>(`/api/workspace/filings/${filingId}/reconciliation`).catch(() => null),
    ]);
    setDocuments(docs);
    setReport(latestReport);
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
      if (selected) await loadDocuments(selected.id);
    } catch (caught) {
      if (caught instanceof Error && caught.message === "Authentication required") {
        router.replace("/auth?mode=login");
      } else {
        setError(caught instanceof Error ? caught.message : "Unable to load documents");
      }
    }
  }, [loadDocuments, router, searchParams]);

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
    await loadDocuments(filingId);
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeFiling) return;
    setBusy(true);
    setError("");
    const form = event.currentTarget;
    try {
      const uploaded = await apiRequest<TaxDocument>(
        `/api/workspace/filings/${activeFiling.id}/documents`,
        { method: "POST", body: new FormData(form) },
      );
      setDocuments((current) => [uploaded, ...current]);
      setReport(null);
      setMessage("Document uploaded. Run reconciliation again to include it.");
      form.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to upload document");
    } finally {
      setBusy(false);
    }
  }

  async function runReconciliation() {
    if (!activeFiling) return;
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest<ReconciliationReport>(
        `/api/workspace/filings/${activeFiling.id}/reconciliation`,
        { method: "POST", body: JSON.stringify({}) },
      );
      setReport(result);
      setMessage("Reconciliation report updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to reconcile documents");
    } finally {
      setBusy(false);
    }
  }

  async function deleteDocument(documentId: number) {
    try {
      await apiRequest<void>(`/api/workspace/documents/${documentId}`, { method: "DELETE" });
      setDocuments((current) => current.filter((document) => document.id !== documentId));
      setReport(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete document");
    }
  }

  const sortedTotals = useMemo(
    () => Object.entries(report?.totals ?? {}).sort(([a], [b]) => a.localeCompare(b)),
    [report],
  );

  if (authLoading || !user) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-5 pb-16 pt-28 lg:px-8">
      <header className="mb-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Document import</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
            Upload once. Reconcile before you file.
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Keep Form 16, AIS/TIS, 26AS, bank-interest and capital-gains documents in one vault, then compare what each source says.
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5">
          <div className="mb-2 flex items-center gap-2 text-sm font-black">
            <ShieldCheck size={18} />
            Privacy boundary
          </div>
          <p className="text-sm text-muted-foreground">
            Files are read from your encrypted vault and the reconciliation report is saved only to this filing workspace.
          </p>
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
          <FileSearch className="mx-auto mb-4" size={42} />
          <h2 className="text-2xl font-black">Create a filing workspace first</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">Documents are reconciled per assessment year, so start from your taxpayer workspace.</p>
          <Link href="/workspace" className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Open workspace</Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="minimal-card h-fit p-4">
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
          </aside>

          <div className="space-y-6">
            <div className="minimal-card p-6">
              <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Selected return</p>
                  <h2 className="mt-1 text-2xl font-black">{activeProfile?.display_name} - {activeFiling ? ayLabel(activeFiling.assessment_year_start) : ""}</h2>
                </div>
                <button onClick={() => void runReconciliation()} disabled={busy || documents.length === 0} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  Reconcile
                </button>
              </div>

              <form onSubmit={uploadDocument} className="rounded-2xl border border-dashed border-border bg-muted/30 p-4">
                <div className="grid gap-3 sm:grid-cols-[160px_1fr_auto]">
                  <select name="category" className="rounded-xl border border-input bg-background px-3 py-2 text-sm">
                    <option value="form_16">Form 16</option>
                    <option value="ais_tis">AIS / TIS</option>
                    <option value="form_26as">Form 26AS</option>
                    <option value="bank_interest">Bank interest</option>
                    <option value="capital_gains">Capital gains</option>
                    <option value="other">Other</option>
                  </select>
                  <input name="file" required type="file" accept=".pdf,.json,.csv,.jpg,.jpeg,.png" className="min-w-0 rounded-xl border border-input bg-background px-3 py-2 text-xs file:mr-3 file:border-0 file:bg-transparent file:font-bold" />
                  <button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
                    <Upload size={15} />
                    Upload
                  </button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  JSON and CSV are parsed directly. PDF parsing is best-effort when the backend PDF dependency is installed.
                </p>
              </form>

              <div className="mt-5 space-y-2">
                {documents.map((document) => (
                  <div key={document.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <div className="rounded-lg bg-muted p-2"><FileText size={18} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{document.original_name}</p>
                      <p className="text-xs capitalize text-muted-foreground">{document.category.replaceAll("_", " ")} - {formatBytes(document.size_bytes)}</p>
                    </div>
                    <a href={`/api/workspace/documents/${document.id}/download`} className="rounded-lg p-2 hover:bg-muted" aria-label={`Download ${document.original_name}`}><Download size={16} /></a>
                    <button onClick={() => void deleteDocument(document.id)} className="rounded-lg p-2 text-destructive hover:bg-destructive/10" aria-label={`Delete ${document.original_name}`}><Trash2 size={16} /></button>
                  </div>
                ))}
                {documents.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">Upload Form 16, AIS/TIS, 26AS, or related documents to begin.</div>}
              </div>
            </div>

            {report && (
              <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="minimal-card p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reconciled totals</p>
                  <div className="mt-4 grid gap-3">
                    {sortedTotals.map(([category, value]) => (
                      <div key={category} className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                        <span className="text-sm font-bold">{labelFor(category)}</span>
                        <span className="font-black">{currency(value)}</span>
                      </div>
                    ))}
                    {sortedTotals.length === 0 && <p className="text-sm text-muted-foreground">No structured totals detected yet.</p>}
                  </div>
                </div>

                <div className="minimal-card p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Findings</p>
                  <div className="mt-4 space-y-3">
                    {report.findings.map((finding, index) => (
                      <div key={`${finding.message}-${index}`} className="flex gap-3 rounded-xl border border-border p-3">
                        {finding.severity === "info" ? <CheckCircle2 className="text-green-600" size={18} /> : <AlertTriangle className="text-amber-600" size={18} />}
                        <p className="text-sm font-medium">{finding.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {report && report.items.length > 0 && (
              <div className="minimal-card overflow-hidden p-6">
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Extracted entries</p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="py-2">Category</th>
                        <th className="py-2">Description</th>
                        <th className="py-2">Document</th>
                        <th className="py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.items.map((item, index) => (
                        <tr key={`${item.document_id}-${index}`} className="border-t border-border">
                          <td className="py-3 font-bold">{labelFor(String(item.category))}</td>
                          <td className="py-3 text-muted-foreground">{String(item.description)}</td>
                          <td className="py-3 text-muted-foreground">{String(item.document_name)}</td>
                          <td className="py-3 text-right font-black">{currency(Number(item.amount))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export function DocumentsWorkbench() {
  return (
    <Suspense>
      <DocumentsWorkbenchInner />
    </Suspense>
  );
}
