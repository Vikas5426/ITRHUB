"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTaxCalculator } from "@/hooks/useTaxCalculator";
import { Calculator } from "lucide-react";

export function TaxRegimeComparison() {
  const [incomeStr, setIncomeStr] = useState("1200000");
  const [deductionsStr, setDeductionsStr] = useState("200000");

  const grossIncome = parseInt(incomeStr) || 0;
  const deductions = parseInt(deductionsStr) || 0;

  const { oldTax, newTax } = useTaxCalculator(grossIncome, deductions);

  const isOldCheaper = oldTax < newTax;
  const isNewCheaper = newTax < oldTax;
  const difference = Math.abs(oldTax - newTax);
  const isTie = oldTax === newTax;

  return (
    <div className="minimal-card p-8 relative overflow-hidden group flex flex-col h-full w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-gray-100 dark:bg-primary/20 text-black dark:text-primary transition-colors">
          <Calculator size={24} />
        </div>
        <h3 className="text-2xl font-bold text-black dark:text-white">Tax Regime Comparison</h3>
      </div>

      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Gross Income (₹)</label>
          <input
            type="number"
            value={incomeStr}
            onChange={(e) => setIncomeStr(e.target.value)}
            className="w-full p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/50 text-black dark:text-white font-bold focus:ring-2 focus:ring-primary outline-none transition-all shadow-inner"
            placeholder="e.g. 1200000"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Deductions (80C, HRA, etc.) (₹)</label>
          <input
            type="number"
            value={deductionsStr}
            onChange={(e) => setDeductionsStr(e.target.value)}
            className="w-full p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/50 text-black dark:text-white font-bold focus:ring-2 focus:ring-primary outline-none transition-all shadow-inner"
            placeholder="e.g. 200000"
          />
          <p className="text-xs text-gray-500 mt-2 font-medium">Includes Standard Deduction. Applied to Old Regime.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-auto">
        {/* Old Regime Column */}
        <motion.div
          whileHover={{ y: -8 }}
          className={`relative p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between ${
            isOldCheaper
              ? 'border-primary shadow-xl shadow-primary/20 bg-primary/5'
              : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5'
          }`}
        >
          {isOldCheaper && difference > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[11px] font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wider whitespace-nowrap z-10"
            >
              You save ₹{difference.toLocaleString('en-IN')}
            </motion.div>
          )}
          <h4 className="text-sm font-bold text-gray-500 dark:text-muted-foreground mb-4 text-center uppercase tracking-wide">Old Regime</h4>
          <div className="text-center mt-auto">
             <p className="text-3xl font-black text-black dark:text-white tracking-tight">
               ₹{oldTax.toLocaleString('en-IN')}
             </p>
             <p className="text-xs font-bold text-gray-400 mt-1 uppercase">Total Tax</p>
          </div>
        </motion.div>

        {/* New Regime Column */}
        <motion.div
          whileHover={{ y: -8 }}
          className={`relative p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between ${
            isNewCheaper
              ? 'border-primary shadow-xl shadow-primary/20 bg-primary/5'
              : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5'
          }`}
        >
          {isNewCheaper && difference > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[11px] font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wider whitespace-nowrap z-10"
            >
              You save ₹{difference.toLocaleString('en-IN')}
            </motion.div>
          )}
          <h4 className="text-sm font-bold text-gray-500 dark:text-muted-foreground mb-4 text-center uppercase tracking-wide">New Regime</h4>
          <div className="text-center mt-auto">
             <p className="text-3xl font-black text-black dark:text-white tracking-tight">
               ₹{newTax.toLocaleString('en-IN')}
             </p>
             <p className="text-xs font-bold text-gray-400 mt-1 uppercase">Total Tax</p>
          </div>
        </motion.div>
      </div>
      
      {isTie && difference === 0 && (
         <p className="text-center text-sm font-bold text-gray-500 mt-6 bg-gray-100 dark:bg-white/5 py-2 rounded-lg">Both regimes result in the exact same tax amount.</p>
      )}
    </div>
  );
}
