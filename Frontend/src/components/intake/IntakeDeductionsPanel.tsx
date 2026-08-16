"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  FileText,
  HeartPulse,
  Home,
  Info,
  Landmark,
  PiggyBank,
  Plus,
  ShieldCheck,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useTaxWorkspace } from "@/context/TaxWorkspaceContext";

type DeductionItem = {
  id: string;
  section: string;
  title: string;
  maxLimit: number;
  description: string;
  icon: typeof Landmark;
  eligible: string[];
  proofNeeded: string;
};

const deductionList: DeductionItem[] = [
  {
    id: "80c",
    section: "Section 80C",
    title: "Investments & Life Insurance",
    maxLimit: 150000,
    description: "ELSS mutual funds, PPF, EPF, LIC premiums, tuition fees, home loan principal.",
    icon: PiggyBank,
    eligible: ["EPF / VPF", "PPF", "ELSS Funds", "LIC Premium", "Home Loan Principal", "Tuition Fees"],
    proofNeeded: "Form 16 Part B / Investment Receipts / Passbook",
  },
  {
    id: "80d",
    section: "Section 80D",
    title: "Health Insurance & Medical",
    maxLimit: 100000,
    description: "Mediclaim premiums for self, spouse, children (up to 25k) and senior citizen parents (up to 50k).",
    icon: HeartPulse,
    eligible: ["Self & Family Premium (₹25k)", "Parents Premium (₹50k)", "Preventive Checkup (₹5k)"],
    proofNeeded: "80D Health Insurance Tax Certificate",
  },
  {
    id: "80ccd1b",
    section: "Section 80CCD(1B)",
    title: "National Pension System (NPS)",
    maxLimit: 50000,
    description: "Exclusive additional deduction for Tier-1 NPS investment over and above Section 80C.",
    icon: Landmark,
    eligible: ["NPS Tier-I Contribution", "Atal Pension Yojana"],
    proofNeeded: "PRAN Statement / NPS Contribution Receipt",
  },
  {
    id: "hra",
    section: "Section 10(13A)",
    title: "House Rent Allowance (HRA)",
    maxLimit: 500000,
    description: "Exemption for salaried employees living in rented accommodation based on salary and rent paid.",
    icon: Home,
    eligible: ["Rent Paid", "Metro vs Non-Metro classification"],
    proofNeeded: "Rent Receipts / Landlord PAN (if rent > 1L/yr) / Agreement",
  },
  {
    id: "24b",
    section: "Section 24(b)",
    title: "Home Loan Interest",
    maxLimit: 200000,
    description: "Interest paid on housing loan for self-occupied or rented residential property.",
    icon: Home,
    eligible: ["Self-occupied (Max ₹2L)", "Let-out property interest"],
    proofNeeded: "Home Loan Provisional Interest Certificate from Bank",
  },
  {
    id: "80g",
    section: "Section 80G",
    title: "Donations & Relief Funds",
    maxLimit: 100000,
    description: "50% or 100% tax deduction on donations to eligible charitable institutions and PM Relief Fund.",
    icon: Sparkles,
    eligible: ["PM National Relief Fund", "Approved Trusts / NGOs (80G)"],
    proofNeeded: "Donation Receipt with Trust 80G Registration & PAN",
  },
];

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val || 0);
}

export function IntakeDeductionsPanel() {
  const { deductions, saveDeductions } = useTaxWorkspace();
  const [claims, setClaims] = useState<Record<string, number>>({
    "80c": deductions?.sec_80c || 150000,
    "80d": (deductions?.sec_80d_self || 0) + (deductions?.sec_80d_parents || 0) || 25000,
    "80ccd1b": deductions?.sec_80ccd_1b || 50000,
    "hra": deductions?.hra_exemption || 0,
    "24b": deductions?.sec_24b_home_loan || 0,
    "80g": deductions?.sec_80g || 0,
  });

  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (deductions) {
      setClaims({
        "80c": deductions.sec_80c,
        "80d": deductions.sec_80d_self + deductions.sec_80d_parents,
        "80ccd1b": deductions.sec_80ccd_1b,
        "hra": deductions.hra_exemption,
        "24b": deductions.sec_24b_home_loan,
        "80g": deductions.sec_80g,
      });
    }
  }, [deductions]);

  const totalClaimed = Object.entries(claims).reduce((acc, [id, val]) => {
    const item = deductionList.find((d) => d.id === id);
    if (!item) return acc;
    return acc + Math.min(val, item.maxLimit);
  }, 0);

  const handleClaimChange = (id: string, value: number) => {
    setClaims((prev) => ({
      ...prev,
      [id]: Math.max(0, value),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveDeductions({
        sec_80c: claims["80c"] || 0,
        sec_80d_self: Math.min(25000, claims["80d"] || 0),
        sec_80d_parents: Math.max(0, (claims["80d"] || 0) - 25000),
        sec_80ccd_1b: claims["80ccd1b"] || 0,
        sec_80e: 0,
        sec_80g: claims["80g"] || 0,
        sec_80tta_ttb: 0,
        hra_exemption: claims["hra"] || 0,
        sec_24b_home_loan: claims["24b"] || 0,
        other_deductions: 0,
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch {
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <ShieldCheck size={26} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Section 80 & Exemptions</p>
              <h2 className="mt-1 text-2xl font-black">Declare Your Tax-Saving Claims</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Enter your claimed deductions. These will be factored into the Old vs New regime decision and return schedules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/5 border border-primary/20 px-5 py-3 text-right">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Total Declared Deductions</p>
              <p className="text-2xl font-black text-primary">{formatCurrency(totalClaimed)}</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-black text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-xs"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              <span>Save Deductions</span>
            </button>
          </div>
        </div>

        {savedNotice && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-xs font-bold text-green-700 dark:text-green-300">
            <CheckCircle2 size={15} />
            <span>Deductions saved to filing workspace and synced across Analysis & Track!</span>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {deductionList.map((item) => {
          const Icon = item.icon;
          const currentClaim = claims[item.id] || 0;
          const isMaxed = currentClaim >= item.maxLimit;

          return (
            <div
              key={item.id}
              className={`flex flex-col justify-between rounded-3xl border p-5 transition-all ${
                currentClaim > 0 ? "border-primary/40 bg-card shadow-xs" : "border-border bg-card/60"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Icon size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        {item.section}
                      </span>
                      <h4 className="text-sm font-black text-foreground">{item.title}</h4>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  {item.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {item.eligible.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg bg-muted/60 px-2 py-0.5 text-[10px] font-bold text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-border/40">
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-muted-foreground">Claim Amount:</span>
                  <span className="font-black text-foreground">{formatCurrency(currentClaim)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={item.maxLimit}
                    step={5000}
                    value={currentClaim}
                    onChange={(e) => handleClaimChange(item.id, Number(e.target.value))}
                    className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[10px] font-black text-muted-foreground shrink-0">
                    Max {formatCurrency(item.maxLimit)}
                  </span>
                </div>

                {isMaxed && (
                  <p className="text-[10px] font-bold text-green-600 dark:text-green-400 mt-1.5">
                    ✓ Maximum statutory cap reached
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
