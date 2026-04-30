import { HeroSection } from "@/components/HeroSection";
import { SmartTaxTools } from "@/components/SmartTaxTools";
import { PortfolioPreview } from "@/components/PortfolioPreview";
import { FilingResources } from "@/components/FilingResources";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Hexagon } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden font-sans relative selection:bg-primary/10 selection:text-primary">
      
      {/* Minimal Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hexagon className="text-primary" fill="currentColor" size={28} />
            <span className="text-xl font-black tracking-tight uppercase">ITRHUB</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Features</a>
            <a href="#" className="hover:text-primary transition-colors">Tax Tools</a>
            <a href="/portfolio" className="hover:text-primary transition-colors">Portfolio</a>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button className="text-sm font-semibold hover:text-primary transition-colors">Log in</button>
            <button className="px-5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-bold shadow-md hover:bg-primary/90 transition-all">
              Sign up
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative pt-16">
        <HeroSection />
        <PortfolioPreview />
        <SmartTaxTools />
        <FilingResources />
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 mt-20 relative z-10 text-center text-muted-foreground text-sm">
        <p>© 2026 ITRHUB. All rights reserved.</p>
      </footer>
    </div>
  );
}
