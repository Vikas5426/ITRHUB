"use client";

import { useEffect, useState } from "react";
import { Calculator, AlertTriangle, ShieldAlert, Sparkles } from "lucide-react";
import { useTaxWorkspace } from "@/context/TaxWorkspaceContext";

export function PenaltyCalculator() {
  const { taxAnalysis, incomeSources } = useTaxWorkspace();
  const [income, setIncome] = useState<string>("");
  const [monthsDelay, setMonthsDelay] = useState<number>(3);
  const [taxPaid, setTaxPaid] = useState<string>("");

  useEffect(() => {
    if (taxAnalysis?.income_summary?.gross_total_income !== undefined) {
      const gti = Number(taxAnalysis.income_summary.gross_total_income);
      setIncome(gti > 0 ? String(gti) : "");
    }
    if (incomeSources?.salary?.tds !== undefined) {
      const tds = Number(incomeSources.salary.tds);
      setTaxPaid(tds > 0 ? String(tds) : "");
    }
  }, [taxAnalysis, incomeSources]);


  const grossIncome = Number(income) || 0;
  const advanceTdsPaid = Number(taxPaid) || 0;

  // Approximate Tax Computation under New Regime (AY 2026-27)
  const computeGrossTax = (inc: number) => {
    const taxable = Math.max(0, inc - 75000); // Standard deduction
    if (taxable <= 700000) return 0; // 87A rebate
    let tax = 0;
    if (taxable > 300000) tax += Math.min(taxable - 300000, 400000) * 0.05;
    if (taxable > 700000) tax += Math.min(taxable - 700000, 300000) * 0.10;
    if (taxable > 1000000) tax += Math.min(taxable - 1000000, 200000) * 0.15;
    if (taxable > 1200000) tax += Math.min(taxable - 1200000, 300000) * 0.20;
    if (taxable > 1500000) tax += (taxable - 1500000) * 0.30;
    return Math.round(tax * 1.04); // 4% cess
  };

  const estimatedTax = computeGrossTax(grossIncome);
  const unpaidTax = Math.max(0, estimatedTax - advanceTdsPaid);

  // Section 234F Late Fee:
  // - ₹0 if income <= basic exemption limit (₹3L)
  // - ₹1,000 if income <= ₹5L
  // - ₹5,000 if income > ₹5L
  const lateFee234F = grossIncome <= 300000 ? 0 : grossIncome <= 500000 ? 1000 : 5000;

  // Section 234A Interest: 1% per month on unpaid tax
  const interest234A = Math.round(unpaidTax * 0.01 * monthsDelay);

  // Section 234B/C estimated interest
  const interest234BC = Math.round(unpaidTax * 0.01 * Math.min(monthsDelay, 12));

  const totalExposure = lateFee234F + interest234A + interest234BC;

  return (
    <div className="bg-card rounded-3xl p-6 md:p-8 shadow-xs border border-border sticky top-24">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 p-2.5 rounded-2xl text-primary">
          <Calculator size={22} />
        </div>
        <div>
          <h3 className="text-lg font-black text-foreground">Penalty & Delay Simulator</h3>
          <p className="text-xs text-muted-foreground">Sections 234F, 234A, 234B & 234C</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-[11px] font-black text-foreground uppercase tracking-wider mb-1.5">
            Gross Annual Income (AY 2026-27)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs font-black text-muted-foreground">
              ₹
            </div>
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="e.g. 1200000"
              className="w-full pl-8 pr-4 py-2.5 bg-background border border-border rounded-xl font-bold text-xs text-foreground focus:outline-none focus:border-primary transition-all shadow-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-black text-foreground uppercase tracking-wider mb-1.5">
            TDS / Advance Tax Already Deducted
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs font-black text-muted-foreground">
              ₹
            </div>
            <input
              type="number"
              value={taxPaid}
              onChange={(e) => setTaxPaid(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full pl-8 pr-4 py-2.5 bg-background border border-border rounded-xl font-bold text-xs text-foreground focus:outline-none focus:border-primary transition-all shadow-xs"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-[11px] font-black text-foreground uppercase tracking-wider">
              Delay Past July 31 Deadline
            </label>
            <span className="text-xs font-black text-primary px-2 py-0.5 bg-primary/10 rounded-full">
              {monthsDelay} {monthsDelay === 1 ? "Month" : "Months"}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="8"
            step="1"
            value={monthsDelay}
            onChange={(e) => setMonthsDelay(Number(e.target.value))}
            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground mt-1">
            <span>Aug (1 mo)</span>
            <span>Dec (5 mos)</span>
            <span>Mar 31 (8 mos)</span>
          </div>
        </div>
      </div>

      {/* Exposure Breakdown */}
      <div className="bg-muted/30 border border-border/80 rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">Total Late Exposure</span>
          <span className="text-xs font-black text-red-600 dark:text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full">
            Delayed filing
          </span>
        </div>
        <div className="text-3xl font-black text-red-600 dark:text-red-500 mb-4">
          ₹{totalExposure.toLocaleString("en-IN")}
        </div>

        <div className="space-y-2 text-xs border-t border-border/40 pt-3">
          <div className="flex justify-between text-muted-foreground font-medium">
            <span>Sec 234F Late Filing Fee:</span>
            <span className="font-black text-foreground">₹{lateFee234F.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between text-muted-foreground font-medium">
            <span>Sec 234A Interest (1%/mo on unpaid tax):</span>
            <span className="font-black text-foreground">₹{interest234A.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between text-muted-foreground font-medium">
            <span>Sec 234B/C Advance Tax Shortfall:</span>
            <span className="font-black text-foreground">₹{interest234BC.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 text-[11px] font-medium text-muted-foreground bg-muted/20 p-3 rounded-xl border border-border/40">
        <ShieldAlert size={15} className="text-amber-500 shrink-0 mt-0.5" />
        <span>Filing on or before July 31 avoids all late fees and preserves your right to carry forward capital and business losses.</span>
      </div>
    </div>
  );
}
