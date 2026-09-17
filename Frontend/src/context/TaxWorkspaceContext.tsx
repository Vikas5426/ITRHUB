"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { apiRequest } from "@/lib/api";

export type TaxpayerProfile = {
  id: number;
  display_name: string;
  entity_type: string;
  relationship: string;
  pan_last_four: string | null;
  date_of_birth: string | null;
  residency_status: string;
  is_primary: boolean;
};

export type FilingWorkspace = {
  id: number;
  profile_id: number;
  assessment_year_start: number;
  itr_form: string | null;
  status: string;
  completion_percent: number;
  current_section: string;
  revision: number;
  progress_data: Record<string, any>;
};

export type IncomeSourcesPayload = {
  salary: {
    enabled: boolean;
    employer_count: number;
    gross_salary: number;
    standard_deduction: number;
    professional_tax: number;
    tds: number;
  };
  house_property: {
    enabled: boolean;
    property_count: number;
    rental_income: number;
    home_loan_interest: number;
    municipal_taxes: number;
  };
  business: {
    enabled: boolean;
    business_type: string;
    presumptive_scheme: string;
    gross_receipts: number;
    expenses: number;
    net_profit: number;
    requires_audit: boolean;
  };
  capital_gains: {
    enabled: boolean;
    listed_equity_stcg: number;
    listed_equity_ltcg: number;
    property_gains: number;
    crypto_vda_gains: number;
    has_loss_carry_forward: boolean;
  };
  foreign: {
    enabled: boolean;
    foreign_income: number;
    foreign_assets: boolean;
    foreign_tax_credit: number;
  };
  other: {
    interest_income: number;
    dividend_income: number;
    agricultural_income: number;
    other_income: number;
    exempt_income: number;
  };
  taxpayer_notes?: string;
};

export type DeductionsPayload = {
  sec_80c: number;
  sec_80d_self: number;
  sec_80d_parents: number;
  sec_80ccd_1b: number;
  sec_80e: number;
  sec_80g: number;
  sec_80tta_ttb: number;
  hra_exemption: number;
  sec_24b_home_loan: number;
  other_deductions: number;
};

export type TaxDocument = {
  id: number;
  workspace_id: number;
  category: string;
  original_name: string;
  content_type: string;
  size_bytes: number;
  uploaded_at: string;
};

export type TaxAnalysis = {
  workspace_id: number;
  assessment_year: string;
  profile: Record<string, any>;
  income_summary: Record<string, any>;
  deductions_summary: {
    total_chapter_via: number;
    total_deductions_old: number;
    total_deductions_new: number;
    breakdown: Record<string, number>;
  };
  old_regime: {
    gross_income: number;
    standard_deduction: number;
    deductions: number;
    taxable_income: number;
    breakdown: Array<{ from: number; to: number | null; rate: number; taxable: number; tax: number }>;
    slab_tax: number;
    tax_after_cess: number;
    effective_rate: number;
  };
  new_regime: {
    gross_income: number;
    standard_deduction: number;
    deductions: number;
    taxable_income: number;
    breakdown: Array<{ from: number; to: number | null; rate: number; taxable: number; tax: number }>;
    slab_tax: number;
    tax_after_cess: number;
    effective_rate: number;
  };
  optimal_regime: "old" | "new";
  tax_savings: number;
  breakeven_deduction: number;
  readiness_score: number;
  audit_checks: Array<{ title: string; status: string; detail: string; tone: "ready" | "warning" }>;
  recommended_itr: string;
  document_count: number;
  has_reconciliation: boolean;
};

interface TaxWorkspaceContextType {
  profiles: TaxpayerProfile[];
  activeProfile: TaxpayerProfile | null;
  filings: FilingWorkspace[];
  activeFiling: FilingWorkspace | null;
  incomeSources: IncomeSourcesPayload | null;
  deductions: DeductionsPayload;
  documents: TaxDocument[];
  taxAnalysis: TaxAnalysis | null;
  loading: boolean;
  error: string;
  selectProfile: (profileId: number) => Promise<void>;
  selectFiling: (filingId: number | null) => Promise<void>;
  createProfile: (data: Partial<TaxpayerProfile>) => Promise<TaxpayerProfile>;
  createFiling: (profileId: number, ayStart: number, itrForm?: string) => Promise<FilingWorkspace>;
  addReturn: (params: {
    returnName: string;
    assessmentYearStart: number;
    itrForm: string;
    profileId?: number;
  }) => Promise<FilingWorkspace>;
  updateReturnName: (filingId: number, name: string) => Promise<void>;
  deleteFiling: (filingId: number) => Promise<void>;
  saveIncomeSources: (payload: IncomeSourcesPayload) => Promise<void>;
  saveDeductions: (payload: DeductionsPayload) => Promise<void>;
  uploadDocument: (formData: FormData) => Promise<TaxDocument>;
  deleteDocument: (docId: number) => Promise<void>;
  runReconciliation: () => Promise<void>;
  applyCapitalGains: (stcg: number, ltcg: number) => Promise<void>;
  refreshAll: () => Promise<void>;
}

const defaultDeductions: DeductionsPayload = {
  sec_80c: 0,
  sec_80d_self: 0,
  sec_80d_parents: 0,
  sec_80ccd_1b: 0,
  sec_80e: 0,
  sec_80g: 0,
  sec_80tta_ttb: 0,
  hra_exemption: 0,
  sec_24b_home_loan: 0,
  other_deductions: 0,
};

const TaxWorkspaceContext = createContext<TaxWorkspaceContextType | null>(null);

export function TaxWorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<TaxpayerProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<TaxpayerProfile | null>(null);
  const [filings, setFilings] = useState<FilingWorkspace[]>([]);
  const [activeFiling, setActiveFiling] = useState<FilingWorkspace | null>(null);
  const [incomeSources, setIncomeSources] = useState<IncomeSourcesPayload | null>(null);
  const [deductions, setDeductions] = useState<DeductionsPayload>(defaultDeductions);
  const [documents, setDocuments] = useState<TaxDocument[]>([]);
  const [taxAnalysis, setTaxAnalysis] = useState<TaxAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadFilingDetails = useCallback(async (filingId: number) => {
    try {
      const [incomeRes, dedRes, docRes, analysisRes] = await Promise.allSettled([
        apiRequest<{ income_sources: IncomeSourcesPayload }>(`/api/workspace/filings/${filingId}/income-sources`),
        apiRequest<{ deductions: DeductionsPayload }>(`/api/workspace/filings/${filingId}/deductions`),
        apiRequest<TaxDocument[]>(`/api/workspace/filings/${filingId}/documents`),
        apiRequest<TaxAnalysis>(`/api/workspace/filings/${filingId}/tax-analysis`),
      ]);

      if (incomeRes.status === "fulfilled" && incomeRes.value.income_sources) {
        setIncomeSources(incomeRes.value.income_sources);
      }
      if (dedRes.status === "fulfilled" && dedRes.value.deductions) {
        setDeductions(dedRes.value.deductions);
      }
      if (docRes.status === "fulfilled") {
        setDocuments(docRes.value);
      }
      if (analysisRes.status === "fulfilled") {
        setTaxAnalysis(analysisRes.value);
      }
    } catch {
      // Ignored for smooth offline fallback
    }
  }, []);

  const refreshAll = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [profileData, filingData] = await Promise.all([
        apiRequest<TaxpayerProfile[]>("/api/workspace/profiles"),
        apiRequest<FilingWorkspace[]>("/api/workspace/filings"),
      ]);

      setProfiles(profileData);
      setFilings(filingData);

      const primaryProfile = profileData.find((p) => p.is_primary) || profileData[0] || null;
      setActiveProfile(primaryProfile);

      const activeF = filingData.find((f) => f.profile_id === primaryProfile?.id) || filingData[0] || null;
      setActiveFiling(activeF);

      if (activeF) {
        await loadFilingDetails(activeF.id);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load tax workspace");
    } finally {
      setLoading(false);
    }
  }, [user, loadFilingDetails]);

  useEffect(() => {
    if (!authLoading) {
      void refreshAll();
    }
  }, [authLoading, refreshAll]);

  const selectProfile = async (profileId: number) => {
    const p = profiles.find((item) => item.id === profileId) || null;
    setActiveProfile(p);
    const f = filings.find((item) => item.profile_id === profileId) || null;
    setActiveFiling(f);
    if (f) {
      await loadFilingDetails(f.id);
    }
  };

  const selectFiling = async (filingId: number | null) => {
    if (filingId === null) {
      setActiveFiling(null);
      return;
    }
    const f = filings.find((item) => item.id === filingId) || null;
    setActiveFiling(f);
    if (f) {
      const p = profiles.find((item) => item.id === f.profile_id) || null;
      setActiveProfile(p);
      await loadFilingDetails(f.id);
    }
  };

  const createProfile = async (data: Partial<TaxpayerProfile>) => {
    const newProfile = await apiRequest<TaxpayerProfile>("/api/workspace/profiles", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setProfiles((prev) => [...prev, newProfile]);
    setActiveProfile(newProfile);
    return newProfile;
  };

  const createFiling = async (profileId: number, ayStart: number, itrForm?: string) => {
    const newFiling = await apiRequest<FilingWorkspace>("/api/workspace/filings", {
      method: "POST",
      body: JSON.stringify({
        profile_id: profileId,
        assessment_year_start: ayStart,
        itr_form: itrForm || "ITR-1",
      }),
    });
    setFilings((prev) => [newFiling, ...prev]);
    setActiveFiling(newFiling);
    await loadFilingDetails(newFiling.id);
    return newFiling;
  };

  const addReturn = async ({
    returnName,
    assessmentYearStart,
    itrForm,
    profileId,
  }: {
    returnName: string;
    assessmentYearStart: number;
    itrForm: string;
    profileId?: number;
  }) => {
    let targetProfileId = profileId;

    if (targetProfileId) {
      const alreadyHasYear = filings.some(
        (f) => f.profile_id === targetProfileId && f.assessment_year_start === assessmentYearStart
      );
      if (alreadyHasYear) {
        const newProf = await apiRequest<TaxpayerProfile>("/api/workspace/profiles", {
          method: "POST",
          body: JSON.stringify({
            display_name: returnName.trim() || `Tax Return ${assessmentYearStart}`,
            entity_type: "individual",
            relationship: "self",
          }),
        });
        setProfiles((prev) => [...prev, newProf]);
        targetProfileId = newProf.id;
      }
    } else {
      const trimmedName = returnName.trim();
      const reusable = profiles.find(
        (p) =>
          p.display_name.toLowerCase() === trimmedName.toLowerCase() &&
          !filings.some((f) => f.profile_id === p.id && f.assessment_year_start === assessmentYearStart)
      );
      if (reusable) {
        targetProfileId = reusable.id;
      } else {
        const newProf = await apiRequest<TaxpayerProfile>("/api/workspace/profiles", {
          method: "POST",
          body: JSON.stringify({
            display_name: trimmedName || `Return AY ${assessmentYearStart}`,
            entity_type: "individual",
            relationship: "self",
          }),
        });
        setProfiles((prev) => [...prev, newProf]);
        targetProfileId = newProf.id;
      }
    }

    const newFiling = await apiRequest<FilingWorkspace>("/api/workspace/filings", {
      method: "POST",
      body: JSON.stringify({
        profile_id: targetProfileId,
        assessment_year_start: assessmentYearStart,
        itr_form: itrForm || "ITR-1",
      }),
    });

    let finalFiling = newFiling;
    if (returnName.trim()) {
      try {
        const updated = await apiRequest<FilingWorkspace>(`/api/workspace/filings/${newFiling.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            progress_data: { return_name: returnName.trim() },
          }),
        });
        finalFiling = updated;
      } catch {
        // Fallback to newFiling if patch fails
      }
    }

    setFilings((prev) => [finalFiling, ...prev]);
    const prof = profiles.find((p) => p.id === targetProfileId) || null;
    setActiveProfile(prof);
    setActiveFiling(finalFiling);
    await loadFilingDetails(finalFiling.id);
    return finalFiling;
  };

  const updateReturnName = async (filingId: number, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      await apiRequest<FilingWorkspace>(`/api/workspace/filings/${filingId}`, {
        method: "PATCH",
        body: JSON.stringify({
          progress_data: { return_name: trimmed },
        }),
      });
    } catch (e) {
      console.warn("Failed to patch filing return_name:", e);
    }

    setFilings((prev) =>
      prev.map((f) =>
        f.id === filingId ? { ...f, progress_data: { ...(f.progress_data || {}), return_name: trimmed } } : f
      )
    );
    if (activeFiling?.id === filingId) {
      setActiveFiling((prev) =>
        prev ? { ...prev, progress_data: { ...(prev.progress_data || {}), return_name: trimmed } } : prev
      );
    }

    const targetFiling = filings.find((f) => f.id === filingId);
    if (targetFiling?.profile_id) {
      try {
        const updatedProfile = await apiRequest<TaxpayerProfile>(
          `/api/workspace/profiles/${targetFiling.profile_id}`,
          {
            method: "PATCH",
            body: JSON.stringify({ display_name: trimmed }),
          }
        );
        setProfiles((prev) => prev.map((p) => (p.id === targetFiling.profile_id ? updatedProfile : p)));
        if (activeProfile?.id === targetFiling.profile_id) {
          setActiveProfile(updatedProfile);
        }
      } catch (e) {
        console.warn("Failed to patch profile display_name:", e);
      }
    }
  };

  const deleteFiling = async (filingId: number) => {
    await apiRequest(`/api/workspace/filings/${filingId}`, {
      method: "DELETE",
    });

    setFilings((prev) => {
      const remaining = prev.filter((f) => f.id !== filingId);
      if (activeFiling?.id === filingId) {
        const nextActive = remaining[0] || null;
        setActiveFiling(nextActive);
        if (nextActive) {
          const nextProf = profiles.find((p) => p.id === nextActive.profile_id) || null;
          setActiveProfile(nextProf);
          void loadFilingDetails(nextActive.id);
        } else {
          setIncomeSources(null);
          setDeductions(defaultDeductions);
          setDocuments([]);
          setTaxAnalysis(null);
        }
      }
      return remaining;
    });
  };

  const saveIncomeSources = async (payload: IncomeSourcesPayload) => {
    if (!activeFiling) return;
    setIncomeSources(payload);
    await apiRequest(`/api/workspace/filings/${activeFiling.id}/income-sources`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    await loadFilingDetails(activeFiling.id);
  };

  const saveDeductions = async (payload: DeductionsPayload) => {
    if (!activeFiling) return;
    setDeductions(payload);
    await apiRequest(`/api/workspace/filings/${activeFiling.id}/deductions`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    await loadFilingDetails(activeFiling.id);
  };

  const uploadDocument = async (formData: FormData) => {
    if (!activeFiling) throw new Error("No active filing workspace");
    const doc = await apiRequest<TaxDocument>(
      `/api/workspace/filings/${activeFiling.id}/documents`,
      { method: "POST", body: formData }
    );
    setDocuments((prev) => [doc, ...prev]);
    await loadFilingDetails(activeFiling.id);
    return doc;
  };

  const deleteDocument = async (docId: number) => {
    if (!activeFiling) return;
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    await apiRequest(`/api/workspace/documents/${docId}`, { method: "DELETE" });
    await loadFilingDetails(activeFiling.id);
  };

  const runReconciliation = async () => {
    if (!activeFiling) return;
    await apiRequest(`/api/workspace/filings/${activeFiling.id}/reconciliation`, {
      method: "POST",
    });
    await loadFilingDetails(activeFiling.id);
  };

  const applyCapitalGains = async (stcg: number, ltcg: number) => {
    if (!activeFiling) return;
    const currentSources = incomeSources || {
      salary: { enabled: false, employer_count: 1, gross_salary: 0, standard_deduction: 75000, professional_tax: 0, tds: 0 },
      house_property: { enabled: false, property_count: 1, rental_income: 0, home_loan_interest: 0, municipal_taxes: 0 },
      business: { enabled: false, business_type: "none", presumptive_scheme: "none", gross_receipts: 0, expenses: 0, net_profit: 0, requires_audit: false },
      capital_gains: { enabled: true, listed_equity_stcg: stcg, listed_equity_ltcg: ltcg, property_gains: 0, crypto_vda_gains: 0, has_loss_carry_forward: false },
      foreign: { enabled: false, foreign_income: 0, foreign_assets: false, foreign_tax_credit: 0 },
      other: { interest_income: 0, dividend_income: 0, agricultural_income: 0, other_income: 0, exempt_income: 0 },
    };
    const updated: IncomeSourcesPayload = {
      ...currentSources,
      capital_gains: {
        ...currentSources.capital_gains,
        enabled: true,
        listed_equity_stcg: stcg,
        listed_equity_ltcg: ltcg,
      },
    };
    await saveIncomeSources(updated);
  };

  return (
    <TaxWorkspaceContext.Provider
      value={{
        profiles,
        activeProfile,
        filings,
        activeFiling,
        incomeSources,
        deductions,
        documents,
        taxAnalysis,
        loading,
        error,
        selectProfile,
        selectFiling,
        createProfile,
        createFiling,
        addReturn,
        updateReturnName,
        deleteFiling,
        saveIncomeSources,
        saveDeductions,
        uploadDocument,
        deleteDocument,
        runReconciliation,
        applyCapitalGains,
        refreshAll,
      }}
    >
      {children}
    </TaxWorkspaceContext.Provider>
  );
}

export function useTaxWorkspace() {
  const context = useContext(TaxWorkspaceContext);
  if (!context) {
    throw new Error("useTaxWorkspace must be used within a TaxWorkspaceProvider");
  }
  return context;
}
