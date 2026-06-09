import { TaxPulseTracker } from "@/components/tracker/TaxPulseTracker";
import { AppNavbar } from "@/components/AppNavbar";

export const metadata = {
  title: "Tax Pulse Tracker | ITRHUB",
  description: "Your personalized tax year mission control dashboard.",
};

export default function TrackerPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative">
      <AppNavbar links={[{ href: "/", label: "Home" }, { href: "/tracker", label: "Tracker" }, { href: "/portfolio", label: "Portfolio" }]} />
      <main className="pt-16">
        <TaxPulseTracker />
      </main>
    </div>
  );
}
