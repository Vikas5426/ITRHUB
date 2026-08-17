"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Plus } from "lucide-react";
import { useTaxWorkspace } from "@/context/TaxWorkspaceContext";

function ayLabel(start: number) {
  return `AY ${start}-${String(start + 1).slice(-2)}`;
}

export function IntakeSetupPanel() {
  const {
    profiles,
    activeProfile,
    filings,
    activeFiling,
    createFiling,
    selectFiling,
    loading,
  } = useTaxWorkspace();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleCreateReturn() {
    const primary = activeProfile || profiles[0];
    if (!primary) return;
    setBusy(true);
    setError("");
    try {
      await createFiling(primary.id, 2026);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create return");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="minimal-card flex items-center justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const has2026Filing = filings.some((f) => f.assessment_year_start === 2026);

  return (
    <section className="minimal-card mb-8 p-6">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Return setup</p>
          <h2 className="mt-2 text-2xl font-black">Start with one return, then add everything to it.</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Your return setup connects taxpayer details, income, documents, broker data, analysis, and tracking.
          </p>
        </div>
        <button
          onClick={() => void handleCreateReturn()}
          disabled={busy || profiles.length === 0 || has2026Filing}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45 shadow-xs"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          <span>{has2026Filing ? "AY 2026-27 Active" : "Start AY 2026-27 return"}</span>
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-semibold text-destructive">
          {error}
        </div>
      )}

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filings.map((filing) => {
          const profile = profiles.find((item) => item.id === filing.profile_id);
          const isSelected = activeFiling?.id === filing.id;
          return (
            <button
              key={filing.id}
              onClick={() => void selectFiling(filing.id)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-xs"
                  : "border-border bg-muted/30 hover:bg-muted/60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-black">{ayLabel(filing.assessment_year_start)}</p>
                    {isSelected && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.2 text-[10px] font-black text-primary uppercase">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {profile?.display_name ?? "Taxpayer"} · {filing.itr_form ?? "ITR-1"}
                  </p>
                </div>
                <CheckCircle2 size={18} className={isSelected ? "text-primary" : "text-green-600"} />
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${filing.completion_percent}%` }}
                />
              </div>
            </button>
          );
        })}
        {filings.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground col-span-full">
            No return created yet. Start AY 2026-27 to unlock income, documents, and analysis.
          </div>
        )}
      </div>
    </section>
  );
}
