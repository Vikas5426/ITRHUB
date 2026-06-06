import { HeroSection } from "@/components/HeroSection";
import { SmartTaxTools } from "@/components/SmartTaxTools";
import { PortfolioPreview } from "@/components/PortfolioPreview";
import { FilingResources } from "@/components/FilingResources";
import { DeductionFinder } from "@/components/DeductionFinder";
import { FilingSteps } from "@/components/FilingSteps";
import { TaxPulse } from "@/components/TaxPulse";
import { AppNavbar } from "@/components/AppNavbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-clip font-sans relative selection:bg-primary/10 selection:text-primary">
      <AppNavbar links={[{ href: "/", label: "Home" }, { href: "/tracker", label: "Tracker" }, { href: "/portfolio", label: "Portfolio" }]} />

      {/* Main Content */}
      <main className="relative pt-16">
        <HeroSection />
        <TaxPulse />
        <PortfolioPreview />
        <SmartTaxTools />
        <DeductionFinder />
        <FilingSteps />
        <FilingResources />
      </main>
    </div>
  );
}
