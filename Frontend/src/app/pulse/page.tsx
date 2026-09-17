import { ProductPageShell } from "@/components/product/ProductPageShell";
import { AuthGate } from "@/components/auth/AuthGate";
import { TaxPulse } from "@/components/TaxPulse";

export const metadata = {
  title: "Tax Pulse Radar | ITRHUB",
  description: "Live statutory deadline tracker, advance tax orbits, and Section 234 penalty radar for AY 2026-27.",
};

const pulseHighlights = [
  "ITR filing deadline (July 31, 2026)",
  "Quarterly advance tax installments (15%, 45%, 75%, 100%)",
  "Section 234A/B/C/F interest & late fee exposure calculator",
  "Statutory .ICS calendar sync for Google/Apple Calendar",
  "Interactive planetary orbit visualization",
];

export default function PulsePage() {
  return (
    <ProductPageShell
      eyebrow="Compliance Intelligence"
      title="Tax Pulse Radar"
      description="Stay ahead of statutory due dates, advance tax tranches, and Section 234 penalty exposure with live orbital tracking."
      sideTitle="Radar scope"
      sideItems={pulseHighlights}
    >
      <AuthGate
        featureTitle="Tax Pulse Radar"
        featureDescription="Sign in to track your personalized statutory deadlines, set calendar reminders, and calculate delay interest exposure."
        highlights={[
          "Live AY 2026-27 statutory deadlines & advance tax calendar",
          "Section 234A, 234B, 234C interest liability calculator",
          "One-click sync to your personal calendar (.ics export)",
          "Integrated penalty exposure mitigation recommendations",
        ]}
      >
        <div className="rounded-3xl border border-border bg-card p-4 sm:p-8 shadow-sm">
          <TaxPulse />
        </div>
      </AuthGate>
    </ProductPageShell>
  );
}
