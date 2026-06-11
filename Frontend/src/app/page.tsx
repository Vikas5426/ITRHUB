import { HeroSection } from "@/components/HeroSection";
import { SmartTaxTools } from "@/components/SmartTaxTools";
import { PortfolioPreview } from "@/components/PortfolioPreview";
import { DeductionFinder } from "@/components/DeductionFinder";
import { TaxPulse } from "@/components/TaxPulse";
import { AppNavbar } from "@/components/AppNavbar";
import { DocumentImportPreview } from "@/components/DocumentImportPreview";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-clip font-sans relative selection:bg-primary/10 selection:text-primary">
      <AppNavbar links={[{ href: "/", label: "Home" }, { href: "/tracker", label: "Tracker" }, { href: "/documents", label: "Documents" }, { href: "/portfolio", label: "Portfolio" }]} />

      {/* Main Content */}
      <main className="relative pt-16">
        <HeroSection />
        <TaxPulse />
        <PortfolioPreview />
        <SmartTaxTools />
        <DocumentImportPreview />
        <DeductionFinder />
      </main>
    </div>
  );
}
