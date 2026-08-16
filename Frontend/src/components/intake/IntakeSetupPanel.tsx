"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Plus } from "lucide-react";

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

function ayLabel(start: number) {
  return `AY ${start}-${String(start + 1).slice(-2)}`;
}

export function IntakeSetupPanel() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filings, setFilings] = useState<Filing[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [profileData, filingData] = await Promise.all([
        apiRequest<Profile[]>("/api/workspace/profiles"),
        apiRequest<Filing[]>("/api/workspace/filings"),
      ]);
      setProfiles(profileData);
      setFilings(filingData);
    } catch (caught) {
      if (caught instanceof Error && caught.message === "Authentication required") {
        router.replace("/auth?mode=login");
      } else {
        setError(caught instanceof Error ? caught.message : "Unable to load return setup");
      }
    }
  }, [router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth?mode=login");
      return;
    }
    if (user) {
      const timer = window.setTimeout(() => void load(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [authLoading, user, router, load]);

  async function createReturn() {
    const primaryProfile = profiles[0];
    if (!primaryProfile) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest<Filing>("/api/workspace/filings", {
        method: "POST",
        body: JSON.stringify({
          profile_id: primaryProfile.id,
          assessment_year_start: 2026,
        }),
      });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create return");
    } finally {
      setBusy(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="minimal-card flex items-center justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <section className="minimal-card mb-8 p-6">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Return setup</p>
          <h2 className="mt-2 text-2xl font-black">Start with one return, then add everything to it.</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Your return setup quietly connects taxpayer details, income, documents, broker data, analysis, and tracking.
          </p>
        </div>
        <button
          onClick={() => void createReturn()}
          disabled={busy || profiles.length === 0 || filings.some((filing) => filing.assessment_year_start === 2026)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Start AY 2026-27 return
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
          return (
            <div key={filing.id} className="rounded-2xl border border-border bg-muted/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{ayLabel(filing.assessment_year_start)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{profile?.display_name ?? "Taxpayer"} - {filing.itr_form ?? "Form pending"}</p>
                </div>
                <CheckCircle2 size={18} className="text-green-600" />
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-background">
                <div className="h-full rounded-full bg-primary" style={{ width: `${filing.completion_percent}%` }} />
              </div>
            </div>
          );
        })}
        {filings.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            No return created yet. Start AY 2026-27 to unlock income, documents, and analysis.
          </div>
        )}
      </div>
    </section>
  );
}
