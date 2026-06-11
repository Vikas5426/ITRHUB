import { HeroSection } from "@/components/HeroSection";
import { SmartTaxTools } from "@/components/SmartTaxTools";
import { PortfolioPreview } from "@/components/PortfolioPreview";
import { DeductionFinder } from "@/components/DeductionFinder";
import { TaxPulse } from "@/components/TaxPulse";
import { AppNavbar } from "@/components/AppNavbar";
import { DocumentImportPreview } from "@/components/DocumentImportPreview";
import { IncomeWizardPreview } from "@/components/IncomeWizardPreview";
import { primaryNavLinks } from "@/lib/navigation";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-clip font-sans relative selection:bg-primary/10 selection:text-primary">
      <AppNavbar links={primaryNavLinks} />

      {/* Main Content */}
      <main className="relative pt-16">
        <HeroSection />
        <TaxPulse />
        <PortfolioPreview />
        <SmartTaxTools />
        <IncomeWizardPreview />
        <DocumentImportPreview />
        <DeductionFinder />
      </main>
    </div>
  );
}
