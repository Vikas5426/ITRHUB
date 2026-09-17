import { ProductPageShell } from "@/components/product/ProductPageShell";
import { AuthGate } from "@/components/auth/AuthGate";
import { SmartTaxTools } from "@/components/SmartTaxTools";
import { DeductionFinder } from "@/components/DeductionFinder";

export const metadata = {
  title: "Smart Tax Tools & Simulator | ITRHUB",
  description: "Real-time Old vs New Regime tax simulator, deduction impact analyzer, and Chapter VI-A explorer for AY 2026-27.",
};

const simulatorHighlights = [
  "AY 2026-27 & AY 2025-26 Indian tax slabs",
  "Enhanced ₹75,000 standard deduction in New Regime",
  "Breakeven deduction threshold calculator",
  "Section 87A tax rebate & surcharge marginal relief",
  "Chapter VI-A interactive deduction explorer (80C, 80D, 80CCD, HRA)",
];

export default function SimulatorPage() {
  return (
    <ProductPageShell
      eyebrow="Decision Intelligence"
      title="Smart Tax Simulator"
      description="Interactive tax engine comparing Old vs New tax regimes side-by-side with real-time deduction simulation and marginal relief calculations."
      sideTitle="Engine Scope"
      sideItems={simulatorHighlights}
    >
      <AuthGate
        featureTitle="Smart Tax Tools & Simulator"
        featureDescription="Sign in to unlock the full interactive tax simulator, adjust income and deduction sliders, and export your optimal regime selection."
        highlights={[
          "Live side-by-side comparison of Old vs New Tax Regimes",
          "Exact breakeven deduction calculation for maximum savings",
          "Comprehensive Chapter VI-A deduction finder with statutory limits",
          "Instant sync of your simulated numbers into Return Intake",
        ]}
      >
        <div className="space-y-12">
          <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
            <SmartTaxTools />
          </div>

          <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
            <DeductionFinder />
          </div>
        </div>
      </AuthGate>
    </ProductPageShell>
  );
}
