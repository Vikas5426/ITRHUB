"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, CheckCircle2, ChevronRight } from "lucide-react";
import { ITRTypeGuide } from "./ITRTypeGuide";
import { TaxRegimeComparison } from "./TaxRegimeComparison";

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
          <TaxRegimeComparison />

          {/* ITR Type Quiz */}
          <div className="minimal-card p-8 flex flex-col justify-between relative overflow-hidden group">
             <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/5 blur-[100px] rounded-full pointer-events-none opacity-0 dark:opacity-100 transition-opacity" />
             <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2 text-black dark:text-white">Which ITR is for you?</h3>
              <p className="text-gray-500 dark:text-muted-foreground font-medium mb-6">Answer 3 simple questions to find your exact filing form.</p>
              
              <ITRTypeGuide />
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
