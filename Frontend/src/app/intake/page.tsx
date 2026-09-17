import { Suspense } from "react";

import { IntakeCommandCenter } from "@/components/intake/IntakeCommandCenter";
import { ProductPageShell } from "@/components/product/ProductPageShell";

export const metadata = {
  title: "Intake | ITRHUB",
  description: "One place to enter taxpayer details, income, documents, brokers, banks, GST, and investments.",
};

export default function IntakePage() {
  return (
    <ProductPageShell
      eyebrow="Intake"
      title="Give ITRHUB everything once."
      description="A guided command center for taxpayer details, income, deductions, documents, broker data, and future bank/GST connections."
    >
      <Suspense fallback={<div className="minimal-card p-8 text-sm font-bold text-muted-foreground">Loading Intake...</div>}>
        <IntakeCommandCenter />
      </Suspense>
    </ProductPageShell>
  );
}
