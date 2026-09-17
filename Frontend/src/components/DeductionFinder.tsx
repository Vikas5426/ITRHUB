"use client";

import { useState, useMemo } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  HeartPulse,
  Home,
  Info,
  Landmark,
  PiggyBank,
  RotateCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";

type DeductionGroup = {
  id: string;
  title: string;
  subtitle: string;
  sections: string[];
  maxLimit: string;
  layoutPosition: "top-1" | "top-2" | "top-3" | "bottom-left" | "bottom-right";
  eligibleInvestments: string[];
  proofDocuments: string[];
  statutoryRule: string;
};

const DEDUCTION_GROUPS: DeductionGroup[] = [
  {
    id: "investments",
    title: "Investments & Wealth",
    subtitle: "Maximize deductions under Section 80C and exclusive Section 80CCD(1B) pension allowance.",
    sections: ["Section 80C", "Section 80CCD(1B)"],
    maxLimit: "₹2,00,000 (₹1.5L + ₹50k)",
    layoutPosition: "top-1",
    statutoryRule: "₹1,50,000 under Section 80C + ₹50,000 exclusive NPS Tier-I allowance under 80CCD(1B).",
    eligibleInvestments: [
      "ELSS Mutual Funds (3-year lock-in period)",
      "Public Provident Fund (PPF) & EPF",
      "National Pension Scheme (NPS Tier-I)",
      "Life Insurance Premiums (Self, Spouse, Children)",
      "Children's School / College Tuition Fees",
      "Home Loan Principal Repayment",
    ],
    proofDocuments: [
      "Form 16 Part B / PF Statement",
      "NPS Tier-I Contribution Statement",
      "ELSS Statement / Life Insurance Receipt",
      "Bank Home Loan Repayment Certificate",
    ],
  },
  {
    id: "health",
    title: "Health & Mediclaim",
    subtitle: "Tax shield under Section 80D for medical insurance covering self, family, and senior parents.",
    sections: ["Section 80D"],
    maxLimit: "Up to ₹1,00,000",
    layoutPosition: "top-2",
    statutoryRule: "₹25k for Self/Family (₹50k if Senior) + ₹50k for Senior Parents + ₹5k Preventive Health Checkup.",
    eligibleInvestments: [
      "Mediclaim Policy Premium (Self & Family)",
      "Health Insurance for Senior Citizen Parents",
      "Preventive Health Checkup (₹5,000 sub-limit)",
      "Senior Citizen Medical Bills (without insurance)",
      "Critical Illness & Super Top-up Plans",
    ],
    proofDocuments: [
      "Section 80D Certificate from Insurer",
      "Preventive Health Checkup Cash/Bank Receipt",
      "Medical Expenditure Bills for Senior Parents",
    ],
  },
  {
    id: "hra",
    title: "House Rent Allowance",
    subtitle: "Legitimate rent deduction under Section 10(13A) for salaried employees across India.",
    sections: ["Section 10(13A)"],
    maxLimit: "Formula Based (Least of 3)",
    layoutPosition: "top-3",
    statutoryRule: "Exemption is the least of: 1) Actual HRA, 2) 50% Basic (Metro) / 40% (Non-Metro), 3) Rent paid minus 10% Basic.",
    eligibleInvestments: [
      "Actual Monthly House Rent Paid",
      "Residential Rental Agreement",
      "Metro Cities: Delhi, Mumbai, Kolkata, Chennai",
      "Non-Metro Cities: All other locations",
    ],
    proofDocuments: [
      "Signed Rent Agreement / Lease Deed",
      "Monthly Rent Receipts with revenue stamp",
      "Landlord PAN (Mandatory if rent > ₹1 Lakh/year)",
    ],
  },
  {
    id: "loans",
    title: "Loan Interest Relief",
    subtitle: "Deduct residential home loan mortgage interest and claim 100% deduction on education loans.",
    sections: ["Section 24(b)", "Section 80E"],
    maxLimit: "₹2,00,000 (Home) + 100% (Edu)",
    layoutPosition: "bottom-left",
    statutoryRule: "Section 24(b): ₹2 Lakh interest on self-occupied home loan. Section 80E: 100% education loan interest for 8 years without upper cap.",
    eligibleInvestments: [
      "Home Loan Interest on Self-occupied Property",
      "Pre-construction Interest (5 equal tranches)",
      "Higher Education Loan Interest (Self/Family)",
      "Undergraduate & Postgraduate Courses (India/Abroad)",
    ],
    proofDocuments: [
      "Annual Home Loan Interest Certificate from Bank",
      "Education Loan Interest Certificate (Sec 80E)",
      "Property Completion / Possession Certificate",
    ],
  },
  {
    id: "donations",
    title: "Interest & Philanthropy",
    subtitle: "Exempt bank savings and senior FD interest, plus claim deduction on approved charitable donations.",
    sections: ["Section 80TTA / 80TTB", "Section 80G"],
    maxLimit: "₹50,000 (Interest) + 100%/50% (80G)",
    layoutPosition: "bottom-right",
    statutoryRule: "80TTA: ₹10k savings interest. 80TTB: ₹50k bank/FD interest for seniors. 80G: 100% or 50% deduction on approved charities.",
    eligibleInvestments: [
      "Savings Bank Account Interest (Sec 80TTA)",
      "Senior Citizen FD & Post Office Interest (Sec 80TTB)",
      "PM National Relief Fund & NDRF (100% deduction)",
      "Approved Registered Charitable NGOs (50% deduction)",
    ],
    proofDocuments: [
      "Bank Annual Interest Summary / AIS & 26AS",
      "Form 10BE Donation Certificate from Charity",
      "Stamped 80G Receipts with 80G Reg Number",
    ],
  },
];

function GridCard({ group }: { group: DeductionGroup }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="w-full h-full min-h-[360px] perspective-1000">
      <div
        className={`grid w-full h-full rounded-[2rem] transition-all duration-500 preserve-3d cursor-pointer ${
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        } group`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* FRONT SIDE */}
        <div className="[grid-area:1/1] backface-hidden w-full h-full">
          <div className="h-full w-full p-6 sm:p-8 bg-card border border-border/80 rounded-[2rem] shadow-xs transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-xl group-hover:border-primary/40 flex flex-col justify-between overflow-hidden relative">
            
            {/* CARD 1: Investments & Wealth (Top-Left in 3-col row) */}
            {group.id === "investments" && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-3 py-1 rounded-full bg-muted/60 border border-border/50">
                      80C & 80CCD
                    </span>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-muted/40 text-foreground border border-border/40">
                      ₹2.0 Lakh Cap
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                    {group.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                    {group.subtitle}
                  </p>

                  {/* Visual Widget: List of items matching Photo Card 1 */}
                  <div className="mt-6 space-y-2.5">
                    {[
                      { name: "ELSS Mutual Funds", meta: "3-yr lock-in", tag: "₹1.5L Limit" },
                      { name: "PPF & EPF Savings", meta: "Sovereign safety", tag: "Tax-Free" },
                      { name: "NPS Tier-I Contribution", meta: "Exclusive retirement", tag: "+₹50,000" },
                      { name: "Life Insurance & Tuition", meta: "Family security", tag: "Deductible" },
                    ].map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-muted/30 transition-colors group-hover:bg-muted/50"
                      >
                        <div>
                          <p className="text-xs font-bold text-foreground">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground">{item.meta}</p>
                        </div>
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-background border border-border/60 text-foreground">
                          {item.tag}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                  <span className="flex items-center gap-1.5">
                    <RotateCw size={12} className="text-muted-foreground group-hover:rotate-180 transition-transform duration-500" />
                    <span>Click to view statutory limits</span>
                  </span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </>
            )}

            {/* CARD 2: Health & Mediclaim (Top-Center in 3-col row) */}
            {group.id === "health" && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-3 py-1 rounded-full bg-muted/60 border border-border/50">
                      Section 80D
                    </span>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-muted/40 text-foreground border border-border/40">
                      Up to ₹1 Lakh
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                    {group.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                    {group.subtitle}
                  </p>

                  {/* Visual Widget: Tilted Insights card matching Photo Card 2 */}
                  <div className="mt-6 rounded-2xl border border-border/80 bg-muted/20 p-4 shadow-xs relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-3 text-xs font-bold text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <HeartPulse size={14} className="text-foreground" />
                        <span>Mediclaim Shield</span>
                      </span>
                      <span>AY 2026-27</span>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground font-semibold">Total Tax Shield Potential</p>
                      <p className="text-2xl font-black text-foreground mt-0.5">₹1,00,000</p>
                    </div>

                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span className="text-muted-foreground">Self & Family</span>
                        <span className="font-bold">₹25,000</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className="bg-foreground h-full w-[25%]" />
                      </div>

                      <div className="flex justify-between font-semibold pt-1">
                        <span className="text-muted-foreground">Senior Parents</span>
                        <span className="font-bold">₹50,000</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className="bg-foreground h-full w-[50%]" />
                      </div>

                      <div className="flex justify-between font-semibold pt-1">
                        <span className="text-muted-foreground">Preventive Health Checkup</span>
                        <span className="font-bold">₹5,000</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                  <span className="flex items-center gap-1.5">
                    <RotateCw size={12} className="text-muted-foreground group-hover:rotate-180 transition-transform duration-500" />
                    <span>Click to view statutory limits</span>
                  </span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </>
            )}

            {/* CARD 3: HRA Exemption (Top-Right in 3-col row) */}
            {group.id === "hra" && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-3 py-1 rounded-full bg-muted/60 border border-border/50">
                      Sec 10(13A)
                    </span>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-muted/40 text-foreground border border-border/40">
                      Salaried Tenants
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                    {group.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                    {group.subtitle}
                  </p>

                  {/* Visual Widget: Concentric orbit + floating pill matching Photo Card 3 */}
                  <div className="mt-6 rounded-2xl border border-border/70 bg-muted/20 p-5 flex flex-col items-center justify-center relative overflow-hidden">
                    {/* Concentric rings */}
                    <div className="size-28 rounded-full border border-border/80 flex items-center justify-center relative">
                      <div className="size-16 rounded-full border border-border/80 flex items-center justify-center bg-card shadow-xs">
                        <Home size={22} className="text-foreground" />
                      </div>
                      <span className="absolute -top-2.5 px-2 py-0.5 rounded-full bg-background border border-border text-[9px] font-black">
                        50% Metro
                      </span>
                      <span className="absolute -bottom-2.5 px-2 py-0.5 rounded-full bg-background border border-border text-[9px] font-black">
                        40% Non-Metro
                      </span>
                    </div>

                    {/* Floating pill matching photo */}
                    <div className="mt-4 w-full text-center py-2 px-3 rounded-full bg-card border border-border/80 shadow-xs text-[11px] font-bold text-foreground">
                      Rent receipts automatically verified
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                  <span className="flex items-center gap-1.5">
                    <RotateCw size={12} className="text-muted-foreground group-hover:rotate-180 transition-transform duration-500" />
                    <span>Click to view statutory limits</span>
                  </span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </>
            )}

            {/* CARD 4: Loan Interest Relief (Bottom-Left in 2-card row) */}
            {group.id === "loans" && (
              <>
                {/* Visual Widget AT TOP matching Photo Card 4 ("Send Money 132.567") */}
                <div>
                  <div className="rounded-2xl border border-border/80 bg-muted/30 p-5 mb-5 relative overflow-hidden">
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-2">
                      <span className="uppercase text-[10px] tracking-wider">Statutory Mortgage & Education Cap</span>
                      <span className="px-2 py-0.5 rounded-full bg-background text-[10px] text-foreground border border-border">
                        Direct Deduction
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl sm:text-4xl font-black text-foreground">₹2,00,000</span>
                      <span className="text-xs font-bold text-muted-foreground">+ 100% Edu</span>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground font-medium">
                      Section 24(b) residential interest + Section 80E unlimited tuition interest for 8 consecutive years.
                    </p>
                  </div>

                  {/* Title & Subtitle AT BOTTOM matching Photo Card 4 */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-3 py-1 rounded-full bg-muted/60 border border-border/50">
                        Sec 24(b) & 80E
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                      {group.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                      {group.subtitle}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                  <span className="flex items-center gap-1.5">
                    <RotateCw size={12} className="text-muted-foreground group-hover:rotate-180 transition-transform duration-500" />
                    <span>Click to view statutory limits</span>
                  </span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </>
            )}

            {/* CARD 5: Interest & Philanthropy (Bottom-Right in 2-card row) */}
            {group.id === "donations" && (
              <>
                {/* Visual Widget AT TOP matching Photo Card 5 (Browser mockup with dots & list) */}
                <div>
                  <div className="rounded-2xl border border-border/80 bg-muted/20 p-5 mb-5 relative overflow-hidden">
                    {/* Browser dots matching photo */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/40">
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-muted-foreground/40" />
                        <span className="size-2 rounded-full bg-muted-foreground/40" />
                        <span className="size-2 rounded-full bg-muted-foreground/40" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        Exemptions & Form 10BE
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div className="rounded-xl border border-border/60 bg-card p-2.5">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Bank Savings (80TTA)</p>
                        <p className="text-sm font-black text-foreground mt-0.5">₹10,000 Exempt</p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-card p-2.5">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Senior FD (80TTB)</p>
                        <p className="text-sm font-black text-foreground mt-0.5">₹50,000 Exempt</p>
                      </div>
                    </div>

                    {/* Philanthropy tag list */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-card/80 border border-border/50 text-[11px] font-bold">
                        <span>PM National Relief Fund & NDRF</span>
                        <span className="text-[10px] font-black text-foreground">100% Deduction</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-card/80 border border-border/50 text-[11px] font-bold">
                        <span>Approved Registered Charitable NGOs</span>
                        <span className="text-[10px] font-black text-muted-foreground">50% Deduction</span>
                      </div>
                    </div>
                  </div>

                  {/* Title & Subtitle AT BOTTOM matching Photo Card 5 */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-3 py-1 rounded-full bg-muted/60 border border-border/50">
                        80TTA/TTB & 80G
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                      {group.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                      {group.subtitle}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                  <span className="flex items-center gap-1.5">
                    <RotateCw size={12} className="text-muted-foreground group-hover:rotate-180 transition-transform duration-500" />
                    <span>Click to view statutory limits</span>
                  </span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </>
            )}

          </div>
        </div>

        {/* BACK SIDE (FLIPPED STATE) */}
        <div className="[grid-area:1/1] backface-hidden w-full h-full [transform:rotateY(180deg)]">
          <div className="h-full w-full p-6 sm:p-8 bg-foreground text-background border border-border rounded-[2rem] shadow-2xl flex flex-col justify-between overflow-hidden">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-background/20">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider opacity-70">
                    Statutory Limit
                  </span>
                  <p className="text-2xl font-black mt-0.5">{group.maxLimit}</p>
                </div>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {group.sections.map((sec) => (
                    <span key={sec} className="px-2.5 py-1 rounded-full bg-background/15 text-background text-[11px] font-bold">
                      {sec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Statutory Rule */}
              <div className="mb-4 rounded-xl bg-background/10 p-3 text-xs leading-relaxed font-medium">
                <p className="font-bold opacity-80 text-[11px] uppercase tracking-wider mb-1">Applicable Rule:</p>
                <p className="opacity-95">{group.statutoryRule}</p>
              </div>

              {/* Eligible Claims */}
              <div className="mb-4">
                <p className="text-[11px] font-black uppercase tracking-wider opacity-75 mb-2">
                  Eligible Investments & Claims
                </p>
                <ul className="space-y-1.5">
                  {group.eligibleInvestments.slice(0, 4).map((inv, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs font-semibold opacity-90 leading-snug">
                      <span className="size-1.5 rounded-full bg-background mt-1.5 shrink-0" />
                      <span>{inv}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Proof Documents */}
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider opacity-75 mb-1.5">
                  Required Proof Documents
                </p>
                <p className="text-[11px] opacity-80 leading-relaxed">
                  {group.proofDocuments.join(" • ")}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-5 pt-3 border-t border-background/20 text-[11px] font-bold opacity-80 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <RotateCw size={12} />
                <span>Click to flip back</span>
              </span>
              <ChevronRight size={12} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DeductionFinder() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredGroups = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return DEDUCTION_GROUPS;
    return DEDUCTION_GROUPS.filter(
      (g) =>
        g.title.toLowerCase().includes(term) ||
        g.subtitle.toLowerCase().includes(term) ||
        g.sections.some((s) => s.toLowerCase().includes(term)) ||
        g.eligibleInvestments.some((inv) => inv.toLowerCase().includes(term))
    );
  }, [searchTerm]);

  const isSearchActive = searchTerm.trim() !== "";

  // Split into Top 3 and Bottom 2 matching reference photo
  const topRowGroups = filteredGroups.filter((g) =>
    ["top-1", "top-2", "top-3"].includes(g.layoutPosition)
  );
  const bottomRowGroups = filteredGroups.filter((g) =>
    ["bottom-left", "bottom-right"].includes(g.layoutPosition)
  );

  return (
    <section id="deductions" className="py-20 px-5 sm:px-8 lg:px-12 relative z-10 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/40">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider mb-3 shadow-xs">
              <Sparkles size={13} />
              <span>Chapter VI-A Deductions Grid</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
              Tax Deduction <span className="text-primary">Finder</span>
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground font-medium">
              Explore eligible exemptions under Section 80C, 80D, HRA, 80CCD, 24(b), and Section 80G. Click any card to flip and inspect statutory limits.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80 shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="text-muted-foreground" size={16} />
            </div>
            <input
              type="text"
              placeholder="Search sections (80C, 80D, HRA, NPS)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-xs font-bold shadow-xs transition-all"
            />
          </div>
        </div>

        {/* 3 + 2 GRID MATCHING REFERENCE PHOTO */}
        {!isSearchActive ? (
          <div className="space-y-6">
            {/* ROW 1: 3 CARDS SIDE-BY-SIDE */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topRowGroups.map((group) => (
                <GridCard key={group.id} group={group} />
              ))}
            </div>

            {/* ROW 2: 2 CARDS SIDE-BY-SIDE (5-col / 7-col split) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5">
                {bottomRowGroups.find((g) => g.layoutPosition === "bottom-left") && (
                  <GridCard
                    group={bottomRowGroups.find((g) => g.layoutPosition === "bottom-left")!}
                  />
                )}
              </div>
              <div className="lg:col-span-7">
                {bottomRowGroups.find((g) => g.layoutPosition === "bottom-right") && (
                  <GridCard
                    group={bottomRowGroups.find((g) => g.layoutPosition === "bottom-right")!}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          /* SEARCH RESULTS GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <GridCard key={group.id} group={group} />
            ))}
          </div>
        )}

        {filteredGroups.length === 0 && (
          <div className="py-16 text-center text-muted-foreground font-bold text-sm bg-card rounded-3xl border border-border">
            No deductions found matching &quot;{searchTerm}&quot;. Try searching for 80C, 80D, HRA, NPS, or Home Loan.
          </div>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
      `,
        }}
      />
    </section>
  );
}
