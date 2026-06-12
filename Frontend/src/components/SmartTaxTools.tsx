"use client";

import Link from "next/link";
import { ArrowRight, BellRing, FileText, FolderOpen } from "lucide-react";
import { TaxRegimeComparison } from "./TaxRegimeComparison";

const nextSteps = [
  {
    href: "/workspace",
    title: "Open workspace",
    text: "Create taxpayer profiles and keep filing progress autosaved.",
    icon: FolderOpen,
  },
  {
    href: "/documents",
    title: "Import documents",
    text: "Upload Form 16, AIS/TIS, 26AS, and broker statements for reconciliation.",
    icon: FileText,
  },
  {
    href: "/tracker",
    title: "Track deadlines",
    text: "Export ITR, advance tax, and audit dates to your calendar.",
    icon: BellRing,
  },
];

export function SmartTaxTools() {
  return (
    <section className="py-20 px-6 lg:px-12 relative z-10 bg-gray-50 dark:bg-transparent">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black mb-4 leading-tight text-black dark:text-white">Smart Tax Tools</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium max-w-2xl mx-auto">
            Make informed decisions before you file. Compare regimes here, then continue into the filing workspace for the full guided flow.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <TaxRegimeComparison />

          <div className="minimal-card p-8 flex flex-col justify-between relative overflow-hidden group">
             <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/5 blur-[100px] rounded-full pointer-events-none opacity-0 dark:opacity-100 transition-opacity" />
             <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2 text-black dark:text-white">Continue with the right next step</h3>
              <p className="text-gray-500 dark:text-muted-foreground font-medium mb-6">
                This page should not make you hunt. Once you have a rough regime estimate, move into the dedicated area that matches what you are trying to finish.
              </p>

              <div className="grid gap-3">
                {nextSteps.map((step) => (
                  <Link
                    key={step.href}
                    href={step.href}
                    className="group/step flex items-start gap-3 rounded-2xl border border-border bg-muted/30 p-4 transition hover:border-primary hover:bg-primary/5"
                  >
                    <step.icon size={19} className="mt-0.5 text-primary" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black text-black dark:text-white">{step.title}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">{step.text}</span>
                    </span>
                    <ArrowRight size={16} className="mt-1 opacity-40 transition group-hover/step:translate-x-1 group-hover/step:opacity-100" />
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="mt-auto p-4 rounded-xl bg-gray-100 dark:bg-primary/10 border border-gray-200 dark:border-primary/20 flex items-start gap-3 relative z-10">
              <FileText className="text-green-600 dark:text-primary shrink-0 mt-0.5 transition-colors" size={20} />
              <div>
                <p className="text-sm text-black dark:text-primary font-bold transition-colors">Single filing path</p>
                <p className="text-xs text-gray-500 dark:text-muted-foreground font-medium mt-1">Income, documents, portfolio, and deadlines now point back to one workspace instead of competing flows.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
