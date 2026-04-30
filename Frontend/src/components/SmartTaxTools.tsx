"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, CheckCircle2, ChevronRight } from "lucide-react";

export function SmartTaxTools() {
  const [regime, setRegime] = useState<"new" | "old">("new");

  return (
    <section className="py-20 px-6 lg:px-12 relative z-10 bg-gray-50 dark:bg-transparent">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black mb-4 leading-tight text-black dark:text-white">Smart Tax Tools</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium max-w-2xl mx-auto">
            Make informed decisions before you file. Compare regimes and find the right ITR form in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Regime Toggle Component */}
          <div className="minimal-card p-8 relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gray-100 dark:bg-primary/20 text-black dark:text-primary transition-colors">
                <Calculator size={24} />
              </div>
              <h3 className="text-2xl font-bold text-black dark:text-white">Regime Comparator</h3>
            </div>
            
            <div className="flex p-1 bg-gray-100 dark:bg-secondary rounded-xl mb-8 relative">
              <button
                className={`flex-1 py-3 text-sm font-bold rounded-lg z-10 transition-colors ${regime === 'old' ? 'text-black dark:text-foreground' : 'text-gray-500 dark:text-muted-foreground'}`}
                onClick={() => setRegime('old')}
              >
                Old Regime
              </button>
              <button
                className={`flex-1 py-3 text-sm font-bold rounded-lg z-10 transition-colors ${regime === 'new' ? 'text-black dark:text-primary-foreground' : 'text-gray-500 dark:text-muted-foreground'}`}
                onClick={() => setRegime('new')}
              >
                New Regime
              </button>
              <motion.div
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-primary rounded-lg shadow-sm"
                initial={false}
                animate={{
                  left: regime === 'old' ? '4px' : '50%',
                }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={regime}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {regime === 'new' ? (
                    <>
                      <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-white/5">
                        <span className="text-gray-500 dark:text-muted-foreground font-medium">Taxable Income Limit</span>
                        <span className="font-bold text-black dark:text-foreground">₹7,00,000 (Tax Free)</span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-white/5">
                        <span className="text-gray-500 dark:text-muted-foreground font-medium">Standard Deduction</span>
                        <span className="font-bold text-black dark:text-foreground">₹50,000</span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-white/5">
                        <span className="text-gray-500 dark:text-muted-foreground font-medium">80C / HRA / LTA</span>
                        <span className="font-bold text-red-500 dark:text-red-400">Not Applicable</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-white/5">
                        <span className="text-gray-500 dark:text-muted-foreground font-medium">Taxable Income Limit</span>
                        <span className="font-bold text-black dark:text-foreground">₹5,00,000 (Tax Free)</span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-white/5">
                        <span className="text-gray-500 dark:text-muted-foreground font-medium">Standard Deduction</span>
                        <span className="font-bold text-black dark:text-foreground">₹50,000</span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-white/5">
                        <span className="text-gray-500 dark:text-muted-foreground font-medium">80C / HRA / LTA</span>
                        <span className="font-bold text-green-600 dark:text-green-400">Applicable</span>
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ITR Type Quiz */}
          <div className="minimal-card p-8 flex flex-col justify-between relative overflow-hidden group">
             <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/5 blur-[100px] rounded-full pointer-events-none opacity-0 dark:opacity-100 transition-opacity" />
             <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2 text-black dark:text-white">Which ITR is for you?</h3>
              <p className="text-gray-500 dark:text-muted-foreground font-medium mb-6">Answer 3 simple questions to find your exact filing form.</p>
              
              <div className="space-y-3 mb-8">
                <button className="w-full p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-black dark:hover:bg-white/10 flex items-center justify-between transition-colors text-left group/btn">
                  <span className="text-black dark:text-foreground font-bold group-hover/btn:text-white dark:group-hover/btn:text-primary transition-colors">I only have Salary Income</span>
                  <ChevronRight size={18} className="text-gray-400 dark:text-muted-foreground group-hover/btn:text-white dark:group-hover/btn:text-primary transition-colors" />
                </button>
                <button className="w-full p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-black dark:hover:bg-white/10 flex items-center justify-between transition-colors text-left group/btn">
                  <span className="text-black dark:text-foreground font-bold group-hover/btn:text-white dark:group-hover/btn:text-primary transition-colors">I have Salary + Stocks/Crypto</span>
                  <ChevronRight size={18} className="text-gray-400 dark:text-muted-foreground group-hover/btn:text-white dark:group-hover/btn:text-primary transition-colors" />
                </button>
                <button className="w-full p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-black dark:hover:bg-white/10 flex items-center justify-between transition-colors text-left group/btn">
                  <span className="text-black dark:text-foreground font-bold group-hover/btn:text-white dark:group-hover/btn:text-primary transition-colors">I am a Freelancer / Business</span>
                  <ChevronRight size={18} className="text-gray-400 dark:text-muted-foreground group-hover/btn:text-white dark:group-hover/btn:text-primary transition-colors" />
                </button>
              </div>
            </div>
            
            <div className="mt-auto p-4 rounded-xl bg-gray-100 dark:bg-primary/10 border border-gray-200 dark:border-primary/20 flex items-start gap-3 relative z-10">
              <CheckCircle2 className="text-green-600 dark:text-primary shrink-0 mt-0.5 transition-colors" size={20} />
              <div>
                <p className="text-sm text-black dark:text-primary font-bold transition-colors">Auto-selection Available</p>
                <p className="text-xs text-gray-500 dark:text-muted-foreground font-medium mt-1">Connect your PAN and we will automatically select the correct ITR form based on your AIS/26AS.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
