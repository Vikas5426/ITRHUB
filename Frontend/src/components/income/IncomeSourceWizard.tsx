"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Globe2,
  Home,
  Landmark,
  Loader2,
  Save,
  WalletCards,
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
  progress_data: Record<string, unknown>;
};

type IncomePayload = {
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
    business_type: "none" | "freelance" | "profession" | "business" | "trading";
    presumptive_scheme: "none" | "44ad" | "44ada" | "44ae";
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
  taxpayer_notes: string;
};

type IncomeResponse = {
  workspace_id: number;
  income_sources: IncomePayload;
  summary: Record<string, number | string[]>;
  recommended_itr: string;
  warnings: string[];
};

const emptyIncome: IncomePayload = {
  salary: {
    enabled: false,
    employer_count: 1,
    gross_salary: 0,
    standard_deduction: 75000,
    professional_tax: 0,
    tds: 0,
  },
  house_property: {
    enabled: false,
    property_count: 1,
    rental_income: 0,
    home_loan_interest: 0,
    municipal_taxes: 0,
  },
  business: {
    enabled: false,
    business_type: "none",
    presumptive_scheme: "none",
    gross_receipts: 0,
    expenses: 0,
    net_profit: 0,
    requires_audit: false,
  },
  capital_gains: {
    enabled: false,
    listed_equity_stcg: 0,
    listed_equity_ltcg: 0,
    property_gains: 0,
    crypto_vda_gains: 0,
    has_loss_carry_forward: false,
  },
  foreign: {
    enabled: false,
    foreign_income: 0,
    foreign_assets: false,
    foreign_tax_credit: 0,
  },
  other: {
    interest_income: 0,
    dividend_income: 0,
    agricultural_income: 0,
    other_income: 0,
    exempt_income: 0,
  },
  taxpayer_notes: "",
};

const steps = [
  { id: "salary", label: "Salary", icon: BriefcaseBusiness },
  { id: "house_property", label: "House property", icon: Home },
  { id: "business", label: "Business", icon: Building2 },
  { id: "capital_gains", label: "Capital gains", icon: Landmark },
  { id: "foreign", label: "Foreign", icon: Globe2 },
  { id: "other", label: "Other", icon: WalletCards },
  { id: "review", label: "Review", icon: CheckCircle2 },
];

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

function numberValue(value: string) {
  return Number(value || 0);
}

function labelFor(key: string) {
  return key.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function IncomeSourceWizardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filings, setFilings] = useState<Filing[]>([]);
  const [activeFilingId, setActiveFilingId] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState("salary");
  const [income, setIncome] = useState<IncomePayload>(emptyIncome);
  const [summary, setSummary] = useState<IncomeResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const activeFiling = filings.find((filing) => filing.id === activeFilingId);
  const activeProfile = profiles.find((profile) => profile.id === activeFiling?.profile_id);

  const loadIncome = useCallback(async (filingId: number) => {
    const response = await apiRequest<IncomeResponse>(`/api/workspace/filings/${filingId}/income-sources`);
    setIncome(response.income_sources);
    setSummary(response);
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
      if (selected) await loadIncome(selected.id);
    } catch (caught) {
      if (caught instanceof Error && caught.message === "Authentication required") {
        router.replace("/auth?mode=login");
      } else {
        setError(caught instanceof Error ? caught.message : "Unable to load income wizard");
      }
    }
  }, [loadIncome, router, searchParams]);

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
    await loadIncome(filingId);
  }

  async function saveIncome() {
    if (!activeFilingId) return;
    setBusy(true);
    setError("");
    try {
      const response = await apiRequest<IncomeResponse>(
        `/api/workspace/filings/${activeFilingId}/income-sources`,
        { method: "PUT", body: JSON.stringify(income) },
      );
      setSummary(response);
      setMessage(`Saved income sources. Recommended form: ${response.recommended_itr}.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save income sources");
    } finally {
      setBusy(false);
    }
  }

  const localTotal = useMemo(() => {
    const businessIncome = income.business.enabled
      ? income.business.net_profit || Math.max(0, income.business.gross_receipts - income.business.expenses)
      : 0;
    const houseIncome = income.house_property.enabled
      ? Math.max(0, income.house_property.rental_income - income.house_property.home_loan_interest - income.house_property.municipal_taxes)
      : 0;
    const gains = income.capital_gains.enabled
      ? income.capital_gains.listed_equity_stcg + income.capital_gains.listed_equity_ltcg + income.capital_gains.property_gains + income.capital_gains.crypto_vda_gains
      : 0;
    return (
      (income.salary.enabled ? income.salary.gross_salary : 0) +
      houseIncome +
      businessIncome +
      gains +
      (income.foreign.enabled ? income.foreign.foreign_income : 0) +
      income.other.interest_income +
      income.other.dividend_income +
      income.other.other_income
    );
  }, [income]);

  type IncomeSection = Exclude<keyof IncomePayload, "taxpayer_notes">;

  const update = <Section extends IncomeSection, Field extends keyof IncomePayload[Section]>(
    section: Section,
    field: Field,
    value: IncomePayload[Section][Field],
  ) => {
    setIncome((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  };

  if (authLoading || !user) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-5 pb-16 pt-28 lg:px-8">
      <header className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Income-source wizard</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Tell ITRHUB what income exists.</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Capture salary, house property, freelance/business, capital gains, crypto/VDA, foreign assets, agricultural and other income in one place.
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <CircleDollarSign size={26} />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current gross total</p>
              <p className="text-2xl font-black">{currency(localTotal)}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">This total updates locally as you fill the wizard. Save to update your workspace.</p>
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
          <h2 className="text-2xl font-black">Create a filing workspace first</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">Income sources are saved per assessment year, so start from your taxpayer workspace.</p>
          <Link href="/workspace" className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Open workspace</Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
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
                        {profile?.display_name ?? "Taxpayer"} · {filing.itr_form ?? "Form pending"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="minimal-card p-3">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(step.id)}
                    className={`mb-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold transition ${activeStep === step.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >
                    <Icon size={17} />
                    {step.label}
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="space-y-6">
            <div className="minimal-card p-6">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Selected return</p>
                  <h2 className="mt-1 text-2xl font-black">{activeProfile?.display_name} · {activeFiling ? ayLabel(activeFiling.assessment_year_start) : ""}</h2>
                </div>
                <button
                  onClick={() => void saveIncome()}
                  disabled={busy || !activeFiling}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save income sources
                </button>
              </div>

              {activeStep === "salary" && (
                <WizardCard
                  title="Salary"
                  description="Use this for salaried employees, pension from employer, and multiple Form 16 cases."
                  enabled={income.salary.enabled}
                  onEnabled={(value) => update("salary", "enabled", value)}
                >
                  <NumberField label="Number of employers" value={income.salary.employer_count} onChange={(value) => update("salary", "employer_count", value)} />
                  <NumberField label="Gross salary" value={income.salary.gross_salary} onChange={(value) => update("salary", "gross_salary", value)} />
                  <NumberField label="Standard deduction" value={income.salary.standard_deduction} onChange={(value) => update("salary", "standard_deduction", value)} />
                  <NumberField label="Professional tax" value={income.salary.professional_tax} onChange={(value) => update("salary", "professional_tax", value)} />
                  <NumberField label="Salary TDS" value={income.salary.tds} onChange={(value) => update("salary", "tds", value)} />
                </WizardCard>
              )}

              {activeStep === "house_property" && (
                <WizardCard
                  title="House property"
                  description="Capture self-occupied/rented properties, home-loan interest, and municipal taxes."
                  enabled={income.house_property.enabled}
                  onEnabled={(value) => update("house_property", "enabled", value)}
                >
                  <NumberField label="Number of properties" value={income.house_property.property_count} onChange={(value) => update("house_property", "property_count", value)} />
                  <NumberField label="Rental income" value={income.house_property.rental_income} onChange={(value) => update("house_property", "rental_income", value)} />
                  <NumberField label="Home-loan interest" value={income.house_property.home_loan_interest} onChange={(value) => update("house_property", "home_loan_interest", value)} />
                  <NumberField label="Municipal taxes" value={income.house_property.municipal_taxes} onChange={(value) => update("house_property", "municipal_taxes", value)} />
                </WizardCard>
              )}

              {activeStep === "business" && (
                <WizardCard
                  title="Business or profession"
                  description="For freelancers, consultants, traders, small businesses, and presumptive taxation."
                  enabled={income.business.enabled}
                  onEnabled={(value) => update("business", "enabled", value)}
                >
                  <SelectField label="Business type" value={income.business.business_type} onChange={(value) => update("business", "business_type", value as IncomePayload["business"]["business_type"])} options={[["none", "None"], ["freelance", "Freelance"], ["profession", "Profession"], ["business", "Business"], ["trading", "Trading"]]} />
                  <SelectField label="Presumptive scheme" value={income.business.presumptive_scheme} onChange={(value) => update("business", "presumptive_scheme", value as IncomePayload["business"]["presumptive_scheme"])} options={[["none", "None"], ["44ad", "44AD"], ["44ada", "44ADA"], ["44ae", "44AE"]]} />
                  <NumberField label="Gross receipts" value={income.business.gross_receipts} onChange={(value) => update("business", "gross_receipts", value)} />
                  <NumberField label="Expenses" value={income.business.expenses} onChange={(value) => update("business", "expenses", value)} />
                  <NumberField label="Net profit" value={income.business.net_profit} onChange={(value) => update("business", "net_profit", value)} />
                  <CheckField label="Tax audit required" checked={income.business.requires_audit} onChange={(value) => update("business", "requires_audit", value)} />
                </WizardCard>
              )}

              {activeStep === "capital_gains" && (
                <WizardCard
                  title="Capital gains"
                  description="Use this for shares, mutual funds, property sales, VDA/crypto, and loss carry-forward."
                  enabled={income.capital_gains.enabled}
                  onEnabled={(value) => update("capital_gains", "enabled", value)}
                >
                  <NumberField label="Listed equity STCG" value={income.capital_gains.listed_equity_stcg} onChange={(value) => update("capital_gains", "listed_equity_stcg", value)} />
                  <NumberField label="Listed equity LTCG" value={income.capital_gains.listed_equity_ltcg} onChange={(value) => update("capital_gains", "listed_equity_ltcg", value)} />
                  <NumberField label="Property gains" value={income.capital_gains.property_gains} onChange={(value) => update("capital_gains", "property_gains", value)} />
                  <NumberField label="Crypto/VDA gains" value={income.capital_gains.crypto_vda_gains} onChange={(value) => update("capital_gains", "crypto_vda_gains", value)} />
                  <CheckField label="Has capital loss carry-forward" checked={income.capital_gains.has_loss_carry_forward} onChange={(value) => update("capital_gains", "has_loss_carry_forward", value)} />
                  <Link href="/portfolio" className="text-sm font-bold text-primary underline underline-offset-4">Use Portfolio Analyzer for detailed trade-level gains</Link>
                </WizardCard>
              )}

              {activeStep === "foreign" && (
                <WizardCard
                  title="Foreign income and assets"
                  description="For NRI/RNOR/resident foreign assets, foreign income, and foreign tax credit."
                  enabled={income.foreign.enabled}
                  onEnabled={(value) => update("foreign", "enabled", value)}
                >
                  <NumberField label="Foreign income" value={income.foreign.foreign_income} onChange={(value) => update("foreign", "foreign_income", value)} />
                  <NumberField label="Foreign tax credit" value={income.foreign.foreign_tax_credit} onChange={(value) => update("foreign", "foreign_tax_credit", value)} />
                  <CheckField label="Has foreign assets or signing authority" checked={income.foreign.foreign_assets} onChange={(value) => update("foreign", "foreign_assets", value)} />
                </WizardCard>
              )}

              {activeStep === "other" && (
                <WizardCard title="Other and exempt income" description="Add bank interest, dividends, agricultural income, and exempt income." enabled onEnabled={() => undefined}>
                  <NumberField label="Interest income" value={income.other.interest_income} onChange={(value) => update("other", "interest_income", value)} />
                  <NumberField label="Dividend income" value={income.other.dividend_income} onChange={(value) => update("other", "dividend_income", value)} />
                  <NumberField label="Agricultural income" value={income.other.agricultural_income} onChange={(value) => update("other", "agricultural_income", value)} />
                  <NumberField label="Other income" value={income.other.other_income} onChange={(value) => update("other", "other_income", value)} />
                  <NumberField label="Exempt income" value={income.other.exempt_income} onChange={(value) => update("other", "exempt_income", value)} />
                  <label className="block text-sm font-bold sm:col-span-2">
                    Filing notes
                    <textarea
                      value={income.taxpayer_notes}
                      onChange={(event) => setIncome((current) => ({ ...current, taxpayer_notes: event.target.value }))}
                      rows={4}
                      className="mt-2 w-full resize-none rounded-xl border border-input bg-background p-3 font-normal outline-none focus:ring-2 focus:ring-ring/20"
                      placeholder="Anything your CA or future self should know?"
                    />
                  </label>
                </WizardCard>
              )}

              {activeStep === "review" && (
                <ReviewPanel response={summary} fallbackTotal={localTotal} />
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <NextStepCard href="/documents" title="Import documents" text="Reconcile Form 16, AIS/TIS, 26AS, and income certificates." />
              <NextStepCard href="/portfolio" title="Analyze capital gains" text="Use broker/CAS files for detailed STCG/LTCG checks." />
              <NextStepCard href="/workspace" title="Return to workspace" text="See progress, notes, and your recommended ITR form." />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function WizardCard({
  title,
  description,
  enabled,
  onEnabled,
  children,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onEnabled: (value: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-black">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold">
          <input type="checkbox" checked={enabled} onChange={(event) => onEnabled(event.target.checked)} className="size-4 accent-current" />
          Applies
        </label>
      </div>
      <div className={`grid gap-4 sm:grid-cols-2 ${enabled ? "" : "pointer-events-none opacity-45"}`}>
        {children}
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <input
        type="number"
        value={value}
        min={0}
        onChange={(event) => onChange(numberValue(event.target.value))}
        className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-ring/20"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-ring/20"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  );
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 text-sm font-bold">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-current" />
      {label}
    </label>
  );
}

function ReviewPanel({ response, fallbackTotal }: { response: IncomeResponse | null; fallbackTotal: number }) {
  const totals = Object.entries(response?.summary ?? { gross_total_income: fallbackTotal }).filter(([, value]) => typeof value === "number");
  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recommended ITR</p>
        <div className="mt-3 rounded-3xl bg-primary p-6 text-primary-foreground">
          <p className="text-6xl font-black">{response?.recommended_itr ?? "Save"}</p>
          <p className="mt-3 text-sm opacity-75">Save the wizard to update your workspace form recommendation.</p>
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Income summary</p>
        <div className="mt-3 grid gap-2">
          {totals.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
              <span className="text-sm font-bold">{labelFor(key)}</span>
              <span className="font-black">{currency(Number(value))}</span>
            </div>
          ))}
        </div>
        {response?.warnings?.length ? (
          <div className="mt-4 space-y-2">
            {response.warnings.map((warning) => (
              <div key={warning} className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm font-medium">
                <AlertTriangle className="shrink-0 text-amber-600" size={18} />
                {warning}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function NextStepCard({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <Link href={href} className="rounded-3xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:shadow-lg">
      <p className="font-black">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </Link>
  );
}

export function IncomeSourceWizard() {
  return (
    <Suspense>
      <IncomeSourceWizardInner />
    </Suspense>
  );
}
