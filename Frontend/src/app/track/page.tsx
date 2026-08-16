import { ProductPageShell } from "@/components/product/ProductPageShell";
import { TrackCommandCenter } from "@/components/tracker/TrackCommandCenter";

export const metadata = {
  title: "Track | ITRHUB",
  description: "Track filing status, deadlines, missing tasks, challans, refunds, notices, and syncs.",
};

const trackingItems = [
  "Filing progress and missing tasks",
  "ITR, advance-tax, audit, and TDS deadlines",
  "Challan and self-assessment tax status",
  "Refund and notice follow-ups",
  "Connected-account sync health",
];

export default function TrackPage() {
  return (
    <ProductPageShell
      eyebrow="Track"
      title="Finish the return without losing the thread."
      description="Deadlines, missing tasks, challans, notices, refund follow-ups, and integration syncs become one operating dashboard."
      sideTitle="Tracking scope"
      sideItems={trackingItems}
    >
      <TrackCommandCenter />
    </ProductPageShell>
  );
}
