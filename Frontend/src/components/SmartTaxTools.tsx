"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { TaxRegimeComparison } from "./TaxRegimeComparison";

export function SmartTaxTools() {
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

          <div className="minimal-card p-8 flex flex-col justify-between relative overflow-hidden group">
             <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/5 blur-[100px] rounded-full pointer-events-none opacity-0 dark:opacity-100 transition-opacity" />
             <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2 text-black dark:text-white">Which income sources apply?</h3>
              <p className="text-gray-500 dark:text-muted-foreground font-medium mb-6">
                The full income wizard handles salary, business, capital gains, house property, foreign assets, exempt income, and then recommends the ITR form.
              </p>

              <div className="grid gap-3 text-sm font-semibold text-gray-600 dark:text-gray-300">
                {["Salary and multiple employers", "Freelance, business, presumptive income", "Capital gains, crypto/VDA, foreign assets"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                    <CheckCircle2 size={17} className="text-green-600" />
                    {item}
                  </div>
                ))}
              </div>

              <Link href="/income" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90">
                Open income wizard
                <ArrowRight size={16} />
              </Link>
            </div>
            
            <div className="mt-auto p-4 rounded-xl bg-gray-100 dark:bg-primary/10 border border-gray-200 dark:border-primary/20 flex items-start gap-3 relative z-10">
              <CheckCircle2 className="text-green-600 dark:text-primary shrink-0 mt-0.5 transition-colors" size={20} />
              <div>
                <p className="text-sm text-black dark:text-primary font-bold transition-colors">Workspace Integrated</p>
                <p className="text-xs text-gray-500 dark:text-muted-foreground font-medium mt-1">Saved income sources update the filing checklist and recommended ITR form.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
