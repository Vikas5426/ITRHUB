import { Suspense } from "react";

import { AnalysisCommandCenter } from "@/components/analysis/AnalysisCommandCenter";
import { ProductPageShell } from "@/components/product/ProductPageShell";

export const metadata = {
  title: "Analysis | ITRHUB",
  description: "One page for tax analysis, insights, deductions, capital gains, return preparation, and JSON export.",
};

const analysisCards = [
  "Unified income and tax summary",
  "Old regime vs new regime",
  "Capital gains and investment review",
  "Deductions and tax-saving opportunities",
  "Return schedules, validation errors, challan guidance, and JSON export",
];

export default function AnalysisPage() {
  return (
    <ProductPageShell
      eyebrow="Analysis"
      title="Everything ITRHUB understood."
      description="One insight center for tax position, savings, mismatches, capital gains, return preparation, validation errors, challan guidance, and JSON export."
      sideTitle="Analysis includes"
      sideItems={analysisCards}
    >
      <Suspense fallback={<div className="minimal-card p-8 text-sm font-bold text-muted-foreground">Loading Analysis...</div>}>
        <AnalysisCommandCenter />
      </Suspense>
    </ProductPageShell>
  );
}
