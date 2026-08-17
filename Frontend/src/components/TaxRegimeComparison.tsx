"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTaxCalculator } from "@/hooks/useTaxCalculator";
import { useTaxWorkspace } from "@/context/TaxWorkspaceContext";
import {
  Calculator,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  Info,
  Sliders,
  ShieldCheck,
  Zap,
} from "lucide-react";

const incomePresets = [
  { label: "₹7.5L (Zero Tax)", value: 750000 },
  { label: "₹10L", value: 1000000 },
  { label: "₹12L", value: 1200000 },
  { label: "₹15L", value: 1500000 },
  { label: "₹25L", value: 2500000 },
  { label: "₹50L", value: 5000000 },
];

export function TaxRegimeComparison() {
  const { taxAnalysis, deductions } = useTaxWorkspace();
  const [grossIncome, setGrossIncome] = useState<number>(
    taxAnalysis?.income_summary?.gross_total_income ?? 1200000
  );
  const [sec80C, setSec80C] = useState<number>(deductions?.sec_80c ?? 0);
  const [sec80D, setSec80D] = useState<number>(
    (deductions?.sec_80d_self ?? 0) + (deductions?.sec_80d_parents ?? 0)
  );
  const [secHraHomeLoan, setSecHraHomeLoan] = useState<number>(
    (deductions?.hra_exemption ?? 0) + (deductions?.sec_24b_home_loan ?? 0)
  );
  const [isAdvancedDeductions, setIsAdvancedDeductions] = useState<boolean>(false);

  useEffect(() => {
    if (taxAnalysis?.income_summary?.gross_total_income !== undefined) {
      setGrossIncome(Number(taxAnalysis.income_summary.gross_total_income) || 0);
    }
  }, [taxAnalysis]);

  useEffect(() => {
    if (deductions) {
      setSec80C(deductions.sec_80c ?? 0);
      setSec80D((deductions.sec_80d_self ?? 0) + (deductions.sec_80d_parents ?? 0));
      setSecHraHomeLoan((deductions.hra_exemption ?? 0) + (deductions.sec_24b_home_loan ?? 0));
    }
  }, [deductions]);


  // Total deductions under Old Regime (Standard deduction ₹50k + Chapter VI-A + 24b)
  const totalOldDeductions = 50000 + sec80C + sec80D + secHraHomeLoan;

  const { oldTax, newTax } = useTaxCalculator(grossIncome, totalOldDeductions);

  const isOldCheaper = oldTax < newTax;
  const isNewCheaper = newTax < oldTax;
  const difference = Math.abs(oldTax - newTax);
  const isTie = oldTax === newTax;

  const oldEffectiveRate = grossIncome > 0 ? ((oldTax / grossIncome) * 100).toFixed(1) : "0.0";
  const newEffectiveRate = grossIncome > 0 ? ((newTax / grossIncome) * 100).toFixed(1) : "0.0";

  // Breakeven deduction threshold where Old Regime beats New Regime
  // At ₹12L, breakeven is around ₹3.75L total deductions
  const taxableNew = Math.max(0, grossIncome - 75000);
  const taxableOld = Math.max(0, grossIncome - totalOldDeductions);

  return (
    <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm flex flex-col justify-between relative overflow-hidden group">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 size-72 bg-primary/5 blur-[90px] rounded-full pointer-events-none" />

      <div>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
              <Calculator size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-foreground">Tax Regime Decision Engine</h3>
                <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-black text-primary uppercase">
                  AY 2026-27
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Simulate Old vs New (Sec 115BAC) slabs, ₹75k standard deduction & 87A rebate
              </p>
            </div>
          </div>

          <Link
            href={`/analysis?section=tax&income=${grossIncome}&deductions=${totalOldDeductions}`}
            className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:underline self-start sm:self-auto"
          >
            <span>Open in Full Analysis</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Quick Income Scenario Pills */}
        <div className="mb-6">
          <label className="block text-[11px] font-black uppercase tracking-wider text-muted-foreground mb-2">
            Quick Salary Presets
          </label>
          <div className="flex flex-wrap gap-2">
            {incomePresets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setGrossIncome(preset.value)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                  grossIncome === preset.value
                    ? "bg-primary text-primary-foreground shadow-xs scale-102"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="space-y-5 mb-8">
          {/* Gross Income Input & Slider */}
          <div className="rounded-2xl border border-border/80 bg-muted/20 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <span>Gross Annual Salary / Income</span>
                <span className="text-[10px] font-normal text-muted-foreground lowercase">(before deductions)</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-black text-muted-foreground">₹</span>
                <input
                  type="number"
                  step="25000"
                  min="0"
                  max="10000000"
                  value={grossIncome || ""}
                  onChange={(e) => setGrossIncome(Number(e.target.value) || 0)}
                  className="w-40 pl-7 pr-3 py-1.5 text-right rounded-xl border border-border bg-card text-foreground font-black text-sm focus:border-primary outline-none shadow-xs"
                />
              </div>
            </div>

            <input
              type="range"
              min="300000"
              max="5000000"
              step="25000"
              value={Math.min(grossIncome, 5000000)}
              onChange={(e) => setGrossIncome(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary mt-1"
            />
            <div className="flex justify-between text-[10px] font-bold text-muted-foreground mt-1">
              <span>₹3 Lakhs (Exempt)</span>
              <span>₹15 Lakhs (30% slab starts)</span>
              <span>₹50 Lakhs+</span>
            </div>
          </div>

          {/* Deductions Configurator */}
          <div className="rounded-2xl border border-border/80 bg-muted/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-black text-foreground uppercase tracking-wider">
                  Old Regime Deductions Declared
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Standard Deduction (₹50k) + 80C + 80D + HRA/Home loan
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-foreground">
                  ₹{totalOldDeductions.toLocaleString("en-IN")}
                </span>
                <button
                  onClick={() => setIsAdvancedDeductions(!isAdvancedDeductions)}
                  className="block text-[10px] font-black text-primary hover:underline mt-0.5 ml-auto"
                >
                  {isAdvancedDeductions ? "Simple Mode" : "Itemize Claims ▾"}
                </button>
              </div>
            </div>

            {/* Itemized Sliders when expanded */}
            {isAdvancedDeductions ? (
              <div className="space-y-3 pt-3 border-t border-border/40">
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-muted-foreground mb-1">
                    <span>Section 80C (PPF, ELSS, EPF, LIC)</span>
                    <span className="font-black text-foreground">₹{sec80C.toLocaleString("en-IN")}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="150000"
                    step="5000"
                    value={sec80C}
                    onChange={(e) => setSec80C(Number(e.target.value))}
                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-muted-foreground mb-1">
                    <span>Section 80D (Health Insurance self + parents)</span>
                    <span className="font-black text-foreground">₹{sec80D.toLocaleString("en-IN")}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="5000"
                    value={sec80D}
                    onChange={(e) => setSec80D(Number(e.target.value))}
                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-muted-foreground mb-1">
                    <span>HRA Exemption / Sec 24(b) Home Loan Interest</span>
                    <span className="font-black text-foreground">₹{secHraHomeLoan.toLocaleString("en-IN")}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="300000"
                    step="10000"
                    value={secHraHomeLoan}
                    onChange={(e) => setSecHraHomeLoan(Number(e.target.value))}
                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="50000"
                  max="600000"
                  step="10000"
                  value={totalOldDeductions}
                  onChange={(e) => {
                    const val = Number(e.target.value) - 50000;
                    setSec80C(Math.min(val, 150000));
                    setSec80D(Math.max(0, Math.min(val - 150000, 50000)));
                    setSecHraHomeLoan(Math.max(0, val - 200000));
                  }}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            )}
          </div>
        </div>

        {/* Side-by-Side Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Old Regime Card */}
          <div
            className={`relative rounded-2xl border-2 p-5 transition-all flex flex-col justify-between ${
              isOldCheaper
                ? "border-green-600 dark:border-green-500 bg-green-500/5 shadow-md"
                : "border-border bg-card/60"
            }`}
          >
            {isOldCheaper && difference > 0 && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] font-black px-3.5 py-1 rounded-full shadow-lg uppercase tracking-wider whitespace-nowrap z-10 flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>Save ₹{difference.toLocaleString("en-IN")} in Old</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider">Old Tax Regime</h4>
                <span className="text-[10px] font-black bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                  Effective: {oldEffectiveRate}%
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border/40">
                <div className="flex justify-between">
                  <span>Gross Income:</span>
                  <span className="font-bold text-foreground">₹{grossIncome.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Deductions:</span>
                  <span className="font-bold text-foreground">- ₹{totalOldDeductions.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxable Income:</span>
                  <span className="font-bold text-foreground">₹{taxableOld.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-border/60 text-center">
              <p className="text-3xl font-black text-foreground tracking-tight">
                ₹{oldTax.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground mt-0.5 uppercase">
                {oldTax === 0 ? "Zero Tax (Rebate u/s 87A)" : "Net Tax Payable (Incl 4% Cess)"}
              </p>
            </div>
          </div>

          {/* New Regime Card */}
          <div
            className={`relative rounded-2xl border-2 p-5 transition-all flex flex-col justify-between ${
              isNewCheaper
                ? "border-green-600 dark:border-green-500 bg-green-500/5 shadow-md"
                : "border-border bg-card/60"
            }`}
          >
            {isNewCheaper && difference > 0 && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] font-black px-3.5 py-1 rounded-full shadow-lg uppercase tracking-wider whitespace-nowrap z-10 flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>Save ₹{difference.toLocaleString("en-IN")} in New</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider">New Regime (115BAC)</h4>
                  <span className="size-2 rounded-full bg-primary animate-pulse" />
                </div>
                <span className="text-[10px] font-black bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                  Effective: {newEffectiveRate}%
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border/40">
                <div className="flex justify-between">
                  <span>Gross Income:</span>
                  <span className="font-bold text-foreground">₹{grossIncome.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Deduction:</span>
                  <span className="font-bold text-foreground">- ₹75,000 (Default)</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxable Income:</span>
                  <span className="font-bold text-foreground">₹{taxableNew.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-border/60 text-center">
              <p className="text-3xl font-black text-foreground tracking-tight">
                ₹{newTax.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground mt-0.5 uppercase">
                {newTax === 0 ? "Zero Tax (Rebate u/s 87A)" : "Net Tax Payable (Incl 4% Cess)"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statutory Advice Banner */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Zap className="size-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-foreground leading-relaxed">
            {isNewCheaper ? (
              <span>
                <strong className="font-black text-primary">Recommendation: Choose New Regime. </strong>
                Because your deductions (₹{totalOldDeductions.toLocaleString("en-IN")}) do not surpass the breakeven threshold, the New Regime offers lower tax rates plus the enhanced ₹75,000 standard deduction.
              </span>
            ) : isOldCheaper ? (
              <span>
                <strong className="font-black text-green-600 dark:text-green-400">Recommendation: Choose Old Regime. </strong>
                Your high deduction claims (₹{totalOldDeductions.toLocaleString("en-IN")}) through 80C, 80D, and HRA/Home loan interest make the Old Regime more tax-efficient by ₹{difference.toLocaleString("en-IN")}.
              </span>
            ) : (
              <span>
                <strong className="font-black text-foreground">Both regimes result in the exact same tax. </strong>
                Under Section 115BAC, you can opt for whichever regime requires fewer proof submissions.
              </span>
            )}
          </p>
        </div>

        <Link
          href="/intake?section=income"
          className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-black hover:opacity-90 transition-opacity"
        >
          <span>Select & File</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
