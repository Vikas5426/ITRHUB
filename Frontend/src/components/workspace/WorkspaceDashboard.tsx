"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronRight,
  Download,
  FileLock2,
  FileText,
  Loader2,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  UsersRound,
} from "lucide-react";

import { useAuth } from "@/components/AuthProvider";
import { apiRequest } from "@/lib/api";

type Profile = {
  id: number;
  display_name: string;
  entity_type: string;
  relationship: string;
  pan_last_four: string | null;
  residency_status: string;
  is_primary: boolean;
};

type Filing = {
  id: number;
  profile_id: number;
  assessment_year_start: number;
  itr_form: string | null;
  status: string;
  completion_percent: number;
  current_section: string;
  revision: number;
  progress_data: { completedSections?: string[]; notes?: string };
  updated_at: string;
};

type TaxDocument = {
  id: number;
  category: string;
  original_name: string;
  content_type: string;
  size_bytes: number;
  uploaded_at: string;
};

const filingSections = [
  { id: "personal_details", label: "Personal details" },
  { id: "income_sources", label: "Income sources" },
  { id: "deductions", label: "Deductions" },
  { id: "taxes_paid", label: "Taxes paid" },
  { id: "review", label: "Review" },
];

function ayLabel(start: number) {
  return `AY ${start}-${String(start + 1).slice(-2)}`;
}

function fyLabel(start: number) {
  return `FY ${start - 1}-${String(start).slice(-2)}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function WorkspaceDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filings, setFilings] = useState<Filing[]>([]);
  const [documents, setDocuments] = useState<TaxDocument[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);
  const [activeFilingId, setActiveFilingId] = useState<number | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [draft, setDraft] = useState<{ completedSections: string[]; notes: string }>({
    completedSections: [],
    notes: "",
  });
  const savingRef = useRef(false);

  const activeProfile = profiles.find((profile) => profile.id === activeProfileId);
  const profileFilings = filings.filter((filing) => filing.profile_id === activeProfileId);
  const activeFiling = filings.find((filing) => filing.id === activeFilingId);

  const loadWorkspace = useCallback(async () => {
    try {
      const [profileData, filingData] = await Promise.all([
        apiRequest<Profile[]>("/api/workspace/profiles"),
        apiRequest<Filing[]>("/api/workspace/filings"),
      ]);
      setProfiles(profileData);
      setFilings(filingData);
      setActiveProfileId((current) => {
        const selectedProfileId = current ?? profileData[0]?.id ?? null;
        const selectedFiling = filingData.find((filing) => filing.profile_id === selectedProfileId);
        setActiveFilingId((currentFiling) => currentFiling ?? selectedFiling?.id ?? null);
        return selectedProfileId;
      });
    } catch (caught) {
      if (caught instanceof Error && caught.message === "Authentication required") {
        router.replace("/auth?mode=login");
      } else {
        setError(caught instanceof Error ? caught.message : "Unable to load workspace");
      }
    }
  }, [router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth?mode=login");
      return;
    }
    if (user) {
      const timer = window.setTimeout(() => void loadWorkspace(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [authLoading, user, router, loadWorkspace]);

  useEffect(() => {
    if (!activeFiling) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDocuments([]);
      return;
    }
    setDraft({
      completedSections: activeFiling.progress_data.completedSections ?? [],
      notes: activeFiling.progress_data.notes ?? "",
    });
    setDirty(false);
    apiRequest<TaxDocument[]>(`/api/workspace/filings/${activeFiling.id}/documents`)
      .then(setDocuments)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load documents"));
  }, [activeFilingId]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveDraft = useCallback(async () => {
    if (!activeFiling || !dirty || savingRef.current) return;
    savingRef.current = true;
    const completed = draft.completedSections;
    const nextSection = filingSections.find((section) => !completed.includes(section.id))?.id ?? "review";
    try {
      const saved = await apiRequest<Filing>(`/api/workspace/filings/${activeFiling.id}/progress`, {
        method: "PUT",
        body: JSON.stringify({
          expected_revision: activeFiling.revision,
          current_section: nextSection,
          completion_percent: Math.round((completed.length / filingSections.length) * 100),
          progress_data: draft,
        }),
      });
      setFilings((current) => current.map((filing) => (filing.id === saved.id ? saved : filing)));
      setDirty(false);
      setMessage("Saved");
      window.setTimeout(() => setMessage(""), 1800);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Autosave failed");
      await loadWorkspace();
    } finally {
      savingRef.current = false;
    }
  }, [activeFiling, dirty, draft, loadWorkspace]);

  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(() => void saveDraft(), 900);
    return () => window.clearTimeout(timer);
  }, [dirty, draft, saveDraft]);

  async function createProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const created = await apiRequest<Profile>("/api/workspace/profiles", {
        method: "POST",
        body: JSON.stringify({
          display_name: data.get("display_name"),
          entity_type: data.get("entity_type"),
          relationship: data.get("relationship"),
          residency_status: data.get("residency_status"),
          pan_last_four: data.get("pan_last_four") || null,
        }),
      });
      setProfiles((current) => [...current, created]);
      setActiveProfileId(created.id);
      setShowProfileForm(false);
      event.currentTarget.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to add taxpayer");
    } finally {
      setBusy(false);
    }
  }

  async function createFiling() {
    if (!activeProfileId) return;
    setBusy(true);
    setError("");
    try {
      const created = await apiRequest<Filing>("/api/workspace/filings", {
        method: "POST",
        body: JSON.stringify({
          profile_id: activeProfileId,
          assessment_year_start: 2026,
        }),
      });
      setFilings((current) => [created, ...current]);
      setActiveFilingId(created.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create filing");
    } finally {
      setBusy(false);
    }
  }

  function toggleSection(sectionId: string) {
    setDraft((current) => ({
      ...current,
      completedSections: current.completedSections.includes(sectionId)
        ? current.completedSections.filter((item) => item !== sectionId)
        : [...current.completedSections, sectionId],
    }));
    setDirty(true);
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeFiling) return;
    setBusy(true);
    setError("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const uploaded = await apiRequest<TaxDocument>(
        `/api/workspace/filings/${activeFiling.id}/documents`,
        { method: "POST", body: formData },
      );
      setDocuments((current) => [uploaded, ...current]);
      form.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to upload document");
    } finally {
      setBusy(false);
    }
  }

  async function deleteDocument(documentId: number) {
    try {
      await apiRequest<void>(`/api/workspace/documents/${documentId}`, { method: "DELETE" });
      setDocuments((current) => current.filter((document) => document.id !== documentId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete document");
    }
  }

  const progress = useMemo(
    () => Math.round((draft.completedSections.length / filingSections.length) * 100),
    [draft.completedSections],
  );

  if (authLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-5 pb-20 pt-28 lg:px-8">
      <header className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Taxpayer workspace</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
            Good to see you, {user.full_name.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">Manage every taxpayer, filing year, progress snapshot, and supporting document from one private workspace.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-muted-foreground">
          <ShieldCheck size={16} className="text-foreground" />
          Private account
        </div>
      </header>

      {(error || message) && (
        <div className={`mb-6 rounded-2xl border p-4 text-sm font-semibold ${error ? "border-destructive/20 bg-destructive/10 text-destructive" : "border-green-600/20 bg-green-600/10 text-green-700 dark:text-green-400"}`}>
          {error || message}
          {error && <button className="float-right" onClick={() => setError("")}>Dismiss</button>}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="minimal-card h-fit p-4">
          <div className="mb-4 flex items-center justify-between px-2">
            <div>
              <h2 className="font-black">Taxpayers</h2>
              <p className="text-xs text-muted-foreground">Family and HUF profiles</p>
            </div>
            <button onClick={() => setShowProfileForm((value) => !value)} className="rounded-full bg-primary p-2 text-primary-foreground" aria-label="Add taxpayer">
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-2">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => {
                  setActiveProfileId(profile.id);
                  setActiveFilingId(filings.find((filing) => filing.profile_id === profile.id)?.id ?? null);
                }}
                className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${activeProfileId === profile.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                <div className={`rounded-xl p-2 ${activeProfileId === profile.id ? "bg-white/15" : "bg-muted"}`}>
                  {profile.entity_type === "huf" ? <UsersRound size={18} /> : <UserRound size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{profile.display_name}</p>
                  <p className={`text-xs capitalize ${activeProfileId === profile.id ? "text-white/65 dark:text-black/65" : "text-muted-foreground"}`}>
                    {profile.is_primary ? "Primary" : profile.relationship} {profile.pan_last_four ? `- PAN ...${profile.pan_last_four}` : ""}
                  </p>
                </div>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>

          {showProfileForm && (
            <form onSubmit={createProfile} className="mt-4 space-y-3 rounded-2xl border border-border bg-muted/40 p-4">
              <input name="display_name" required placeholder="Taxpayer name" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <select name="entity_type" className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="individual">Individual</option>
                  <option value="huf">HUF</option>
                </select>
                <select name="relationship" className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="spouse">Spouse</option>
                  <option value="parent">Parent</option>
                  <option value="child">Child</option>
                  <option value="other">Other</option>
                  <option value="huf">HUF</option>
                </select>
              </div>
              <select name="residency_status" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="resident">Resident</option>
                <option value="nri">NRI</option>
                <option value="rnor">RNOR</option>
              </select>
              <input name="pan_last_four" minLength={4} maxLength={4} placeholder="Last 4 of PAN (optional)" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm uppercase" />
              <button disabled={busy} className="w-full rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground">Add taxpayer</button>
            </form>
          )}
        </aside>

        <section className="space-y-6">
          <div className="minimal-card p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Selected taxpayer</p>
                <h2 className="mt-1 text-2xl font-black">{activeProfile?.display_name}</h2>
              </div>
              <button onClick={() => void createFiling()} disabled={busy || profileFilings.some((filing) => filing.assessment_year_start === 2026)} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">
                <Plus size={16} />
                Start {ayLabel(2026)}
              </button>
            </div>

            {profileFilings.length > 0 ? (
              <div className="mt-6 flex gap-3 overflow-x-auto pb-1">
                {profileFilings.map((filing) => (
                  <button key={filing.id} onClick={() => setActiveFilingId(filing.id)} className={`min-w-48 rounded-2xl border p-4 text-left transition ${activeFilingId === filing.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}>
                    <p className="font-black">{ayLabel(filing.assessment_year_start)}</p>
                    <p className={`mt-1 text-xs ${activeFilingId === filing.id ? "opacity-65" : "text-muted-foreground"}`}>{fyLabel(filing.assessment_year_start)} · {filing.itr_form ?? "Form not selected"}</p>
                    <div className={`mt-4 h-1.5 overflow-hidden rounded-full ${activeFilingId === filing.id ? "bg-white/20 dark:bg-black/20" : "bg-muted"}`}>
                      <div className={`h-full rounded-full ${activeFilingId === filing.id ? "bg-white dark:bg-black" : "bg-primary"}`} style={{ width: `${filing.completion_percent}%` }} />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No filing workspace yet. Start with AY 2026-27.</div>
            )}
          </div>

          {activeFiling && (
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="minimal-card p-6">
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Filing progress</p>
                    <h3 className="mt-1 text-2xl font-black">{progress}% complete</h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    {dirty ? <><Loader2 size={14} className="animate-spin" /> Saving</> : <><Save size={14} /> Autosaved</>}
                  </div>
                </div>
                <div className="space-y-2">
                  {filingSections.map((section) => {
                    const complete = draft.completedSections.includes(section.id);
                    return (
                      <button key={section.id} onClick={() => toggleSection(section.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${complete ? "border-green-600/20 bg-green-600/10" : "border-border hover:bg-muted"}`}>
                        <span className={`flex size-6 items-center justify-center rounded-full border ${complete ? "border-green-600 bg-green-600 text-white" : "border-border"}`}>{complete && <Check size={14} />}</span>
                        <span className="text-sm font-bold">{section.label}</span>
                      </button>
                    );
                  })}
                </div>
                <label className="mt-5 block text-sm font-bold">
                  Private filing notes
                  <textarea
                    value={draft.notes}
                    onChange={(event) => {
                      setDraft((current) => ({ ...current, notes: event.target.value }));
                      setDirty(true);
                    }}
                    rows={4}
                    placeholder="What is still missing? Add reminders for yourself."
                    className="mt-2 w-full resize-none rounded-xl border border-input bg-background p-3 font-normal outline-none focus:ring-2 focus:ring-ring/20"
                  />
                </label>
              </div>

              <div className="minimal-card p-6">
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Document vault</p>
                    <h3 className="mt-1 text-2xl font-black">Encrypted files</h3>
                  </div>
                  <FileLock2 size={28} />
                </div>

                <form onSubmit={uploadDocument} className="rounded-2xl border border-dashed border-border bg-muted/30 p-4">
                  <div className="grid gap-3 sm:grid-cols-[140px_1fr_auto]">
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
                  <p className="mt-3 text-xs text-muted-foreground">PDF, JSON, CSV, JPG or PNG. Maximum 10 MB. Files are encrypted before database storage.</p>
                </form>

                <div className="mt-4 space-y-2">
                  {documents.map((document) => (
                    <div key={document.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                      <div className="rounded-lg bg-muted p-2"><FileText size={18} /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{document.original_name}</p>
                        <p className="text-xs capitalize text-muted-foreground">{document.category.replaceAll("_", " ")} · {formatBytes(document.size_bytes)}</p>
                      </div>
                      <a href={`/api/workspace/documents/${document.id}/download`} className="rounded-lg p-2 hover:bg-muted" aria-label={`Download ${document.original_name}`}><Download size={16} /></a>
                      <button onClick={() => void deleteDocument(document.id)} className="rounded-lg p-2 text-destructive hover:bg-destructive/10" aria-label={`Delete ${document.original_name}`}><Trash2 size={16} /></button>
                    </div>
                  ))}
                  {documents.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No documents uploaded for this assessment year.</div>}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
