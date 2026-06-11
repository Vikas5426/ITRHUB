import { TaxPulseTracker } from "@/components/tracker/TaxPulseTracker";
import { AppNavbar } from "@/components/AppNavbar";
import { primaryNavLinks } from "@/lib/navigation";

export const metadata = {
  title: "Tax Pulse Tracker | ITRHUB",
  description: "Your personalized tax year mission control dashboard.",
};

export default function TrackerPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative">
      <AppNavbar links={primaryNavLinks} />
      <main className="pt-16">
        <TaxPulseTracker />
      </main>
    </div>
  );
}
