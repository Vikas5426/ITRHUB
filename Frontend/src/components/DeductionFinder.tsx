"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
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
} from "lucide-react";

interface Deduction {
  id: string;
  name: string;
  shortCode: string;
  category: string;
  description: string;
  maxLimit: string;
  highlightLimit: string;
  eligibleInvestments: string[];
  bentoClass: string;
}

const DEDUCTIONS: Deduction[] = [
  {
    id: "80c",
    name: "Section 80C",
    shortCode: "80C",
    category: "Statutory Savings",
    description: "The primary tax deduction covering PPF, EPF, ELSS, life insurance, and home loan principal.",
    maxLimit: "₹1,50,000",
    highlightLimit: "₹1.5 Lakh",
    eligibleInvestments: [
      "ELSS Mutual Funds (3-yr lock-in)",
      "Public Provident Fund (PPF)",
      "Employee Provident Fund (EPF)",
      "Life Insurance Premiums",
      "Home Loan Principal Repayment",
      "Children's School Tuition Fees",
    ],
    // Col 1, Rows 1 & 2 (Tall phone-like card)
    bentoClass: "lg:col-start-1 lg:row-start-1 lg:row-span-2",
  },
  {
    id: "80tta",
    name: "Section 80TTA / 80TTB",
    shortCode: "80TTA",
    category: "Bank Interest",
    description: "Exemption on savings interest (80TTA) and FD interest for senior citizens (80TTB).",
    maxLimit: "₹10,000 (₹50,000 for Seniors)",
    highlightLimit: "₹10k / ₹50k",
    eligibleInvestments: [
      "Savings Bank Account Interest",
      "Co-operative Bank Savings",
      "Post Office Savings Interest",
      "Senior Citizen Fixed Deposits (80TTB)",
    ],
    // Col 2, Row 1 (Compact card)
    bentoClass: "lg:col-start-2 lg:row-start-1",
  },
  {
    id: "80e",
    name: "Section 80E",
    shortCode: "80E",
    category: "Education Loan",
    description: "100% deduction on interest paid for higher education loans for 8 consecutive assessment years.",
    maxLimit: "100% of Interest (No Upper Cap)",
    highlightLimit: "No Cap",
    eligibleInvestments: [
      "Higher Education Loan Interest",
      "Course in India or Abroad",
      "Available for Self, Spouse & Children",
    ],
    // Col 3, Row 1 (Horizontal pill card)
    bentoClass: "lg:col-start-3 lg:row-start-1",
  },
  {
    id: "24b",
    name: "Section 24(b)",
    shortCode: "24(b)",
    category: "Home Loan",
    description: "Tax relief on the interest paid for home loan of self-occupied residential property.",
    maxLimit: "₹2,00,000",
    highlightLimit: "₹2.0 Lakh",
    eligibleInvestments: [
      "Home Loan Interest Certificate",
      "Self-occupied Residential Property",
      "Pre-construction Interest (in 5 tranches)",
    ],
    // Col 4, Row 1 (Bold statement card)
    bentoClass: "lg:col-start-4 lg:row-start-1",
  },
  {
    id: "80d",
    name: "Section 80D",
    shortCode: "80D",
    category: "Health & Mediclaim",
    description: "Deductions for health insurance premiums paid for self, family, and senior citizen parents.",
    maxLimit: "₹25,000 - ₹1,00,000",
    highlightLimit: "Up to ₹1L",
    eligibleInvestments: [
      "Self & Family Premium (Up to ₹25k)",
      "Senior Citizen Parents (Up to ₹50k)",
      "Preventive Health Checkup (₹5,000 sub-limit)",
      "Senior Medical Expenses (without insurance)",
    ],
    // Cols 2 & 3, Row 2 (Large center banner card)
    bentoClass: "lg:col-start-2 lg:col-span-2 lg:row-start-2",
  },
  {
    id: "80ccd1b",
    name: "Section 80CCD(1B)",
    shortCode: "80CCD",
    category: "Pension & NPS",
    description: "Exclusive additional deduction for contribution to National Pension Scheme (NPS) over 80C.",
    maxLimit: "₹50,000 (Over & above 80C)",
    highlightLimit: "+₹50k",
    eligibleInvestments: [
      "NPS Tier-I Account Contribution",
      "Atal Pension Yojana (APY)",
      "Additional ₹50k savings buffer",
    ],
    // Col 1, Row 3 (Square card)
    bentoClass: "lg:col-start-1 lg:row-start-3",
  },
  {
    id: "hra",
    name: "HRA Exemption (Sec 10(13A))",
    shortCode: "HRA",
    category: "Rent Allowance",
    description: "Exemption for salaried employees living in rented homes based on rent paid and city tier.",
    maxLimit: "Least of: Actual HRA, 50%/40% Salary, or Rent - 10% Salary",
    highlightLimit: "Formula Based",
    eligibleInvestments: [
      "Actual Rent Receipts / Agreement",
      "Landlord PAN (if rent > ₹1 Lakh/year)",
      "50% Salary (Metro) / 40% (Non-Metro)",
    ],
    // Cols 2 & 3, Row 3 (Wide horizontal card)
    bentoClass: "lg:col-start-2 lg:col-span-2 lg:row-start-3",
  },
  {
    id: "80g",
    name: "Section 80G",
    shortCode: "80G",
    category: "Charitable Donations",
    description: "Tax deduction on donations made to approved relief funds, NGOs, and charitable organizations.",
    maxLimit: "50% or 100% with Qualifying Limit",
    highlightLimit: "50% / 100%",
    eligibleInvestments: [
      "PM National Relief Fund (100%)",
      "National Defence Fund (100%)",
      "Approved Registered NGOs (50%)",
      "Form 10BE Donation Certificate",
      "Direct Bank Transfer / Cheque receipts",
    ],
    // Col 4, Rows 2 & 3 (Vertical pill stack card)
    bentoClass: "lg:col-start-4 lg:row-start-2 lg:row-span-2",
  },
];

function BentoCard({
  deduction,
  layoutType,
}: {
  deduction: Deduction;
  layoutType: "bento" | "grid";
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  const containerClasses =
    layoutType === "bento"
      ? `${deduction.bentoClass} w-full h-full min-h-[220px]`
      : "w-full h-full min-h-[240px]";

  return (
    <div className={`${containerClasses} perspective-1000`}>
      <div
        className={`grid w-full h-full rounded-[2rem] transition-all duration-500 preserve-3d cursor-pointer ${
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        } group`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* FRONT SIDE */}
        <div className="[grid-area:1/1] backface-hidden w-full h-full">
          <div className="h-full w-full p-6 sm:p-7 bg-card border border-border/80 rounded-[2rem] shadow-xs transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-xl group-hover:border-primary/40 flex flex-col justify-between overflow-hidden relative">
            {/* Subtle card ambient highlight */}
            <div className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-muted/40 blur-2xl group-hover:bg-primary/5 transition-all" />

            {/* TOP HEADER */}
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-3 py-1 rounded-full bg-muted/60 border border-border/50">
                  {deduction.category}
                </span>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-muted/40 text-foreground border border-border/40">
                  {deduction.highlightLimit}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                {deduction.name}
              </h3>

              <p className="mt-2 text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                {deduction.description}
              </p>

              {/* SPECIALIZED FRONT VISUALS FOR SPECIFIC CARDS */}
              {deduction.id === "80c" && (
                <div className="mt-5 space-y-2">
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5 text-xs font-semibold flex items-center justify-between">
                    <span>ELSS Mutual Funds</span>
                    <span className="text-[10px] text-muted-foreground font-bold">3-yr lock-in</span>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5 text-xs font-semibold flex items-center justify-between">
                    <span>PPF & EPF</span>
                    <span className="text-[10px] text-muted-foreground font-bold">Sovereign safety</span>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5 text-xs font-semibold flex items-center justify-between">
                    <span>Life Insurance & Tuition</span>
                    <span className="text-[10px] text-muted-foreground font-bold">Family safety</span>
                  </div>
                </div>
              )}

              {deduction.id === "80d" && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Self & Family</p>
                    <p className="font-black text-foreground mt-0.5">₹25,000</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Senior Parents</p>
                    <p className="font-black text-foreground mt-0.5">₹50,000</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Preventive Check</p>
                    <p className="font-black text-foreground mt-0.5">₹5,000</p>
                  </div>
                </div>
              )}

              {deduction.id === "80g" && (
                <div className="mt-4 space-y-1.5">
                  {[
                    "PM National Relief Fund (100%)",
                    "National Defence Fund (100%)",
                    "Registered NGOs (50%)",
                    "Form 10BE Verified",
                    "Qualifying Cap Applicable",
                  ].map((tag) => (
                    <div
                      key={tag}
                      className="w-full text-center py-1.5 px-3 rounded-full bg-muted/60 border border-border/60 text-[11px] font-bold text-foreground/90"
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              )}

              {deduction.id === "hra" && (
                <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                  <p className="font-bold text-foreground text-[11px] mb-1">Calculation Rule:</p>
                  <p className="text-[11px] leading-relaxed">
                    Least of Actual HRA, 50% Salary (metro) / 40% (non-metro), or Rent paid exceeding 10% of salary.
                  </p>
                </div>
              )}
            </div>

            {/* BOTTOM FLIP PROMPT */}
            <div className="relative z-10 mt-6 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">
              <span className="flex items-center gap-1.5">
                <RotateCw size={12} className="text-muted-foreground group-hover:rotate-180 transition-transform duration-500" />
                <span>Click to view statutory rules</span>
              </span>
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* BACK SIDE (FLIPPED STATE) */}
        <div className="[grid-area:1/1] backface-hidden w-full h-full [transform:rotateY(180deg)]">
          <div className="h-full w-full p-6 sm:p-7 bg-foreground text-background border border-border rounded-[2rem] shadow-2xl flex flex-col justify-between overflow-hidden">
            <div>
              {/* BACK HEADER */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-background/20">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider opacity-70">
                    Statutory Cap
                  </span>
                  <p className="text-2xl font-black mt-0.5">{deduction.maxLimit}</p>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-background/10 text-background text-[11px] font-bold">
                  {deduction.shortCode}
                </div>
              </div>

              {/* ELIGIBLE ITEMS LIST */}
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider opacity-75 mb-2.5">
                  Eligible Claims & Evidence
                </p>
                <ul className="space-y-2">
                  {deduction.eligibleInvestments.map((inv, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs font-semibold opacity-90 leading-snug">
                      <span className="size-1.5 rounded-full bg-background mt-1.5 shrink-0" />
                      <span>{inv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* BACK FOOTER */}
            <div className="mt-5 pt-3 border-t border-background/20 text-[11px] font-bold opacity-80 flex items-center justify-between">
              <span className="flex items-center gap-1">
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

  const filteredDeductions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return DEDUCTIONS;
    return DEDUCTIONS.filter(
      (d) =>
        d.name.toLowerCase().includes(term) ||
        d.shortCode.toLowerCase().includes(term) ||
        d.description.toLowerCase().includes(term) ||
        d.eligibleInvestments.some((inv) => inv.toLowerCase().includes(term))
    );
  }, [searchTerm]);

  const isBentoMode = searchTerm.trim() === "";

  return (
    <section id="deductions" className="py-20 px-5 sm:px-8 lg:px-12 relative z-10 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/40">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider mb-3">
              <Sparkles size={13} />
              <span>Chapter VI-A Bento Explorer</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
              Tax Deduction <span className="text-primary">Finder</span>
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground font-medium">
              Explore eligible exemptions under Section 80C, 80D, HRA, 80CCD, and Section 24(b). Click any card to flip and inspect statutory limits.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80 shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="text-muted-foreground" size={16} />
            </div>
            <input
              type="text"
              placeholder="Search deductions (80C, 80D, HRA)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-xs font-bold shadow-xs transition-all"
            />
          </div>
        </div>

        {/* BENTO GRID (When no search active) */}
        {isBentoMode ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-[minmax(180px,auto)]">
            {DEDUCTIONS.map((deduction) => (
              <BentoCard key={deduction.id} deduction={deduction} layoutType="bento" />
            ))}
          </div>
        ) : (
          /* FILTERED GRID (When searching) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeductions.map((deduction) => (
              <BentoCard key={deduction.id} deduction={deduction} layoutType="grid" />
            ))}
          </div>
        )}

        {filteredDeductions.length === 0 && (
          <div className="py-16 text-center text-muted-foreground font-bold text-sm bg-card rounded-3xl border border-border">
            No deductions found matching &quot;{searchTerm}&quot;. Try searching for 80C, 80D, HRA, or NPS.
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
