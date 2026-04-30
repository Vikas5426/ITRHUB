import { PortfolioAnalyzer } from "@/components/PortfolioAnalyzer";

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden font-sans relative">
      <main className="relative pt-24 px-6 lg:px-12 max-w-7xl mx-auto pb-20">
        <div className="mb-12">
          <h1 className="text-5xl font-black mb-4 leading-tight text-black dark:text-white tracking-tight">Portfolio Analyzer</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium max-w-2xl">
            Upload your CAS or CAMS statement. We'll automatically identify your assets, compute your holding periods, and visualize your exact Short-Term and Long-Term Capital Gains tax liabilities based on FY 2025-26 laws.
          </p>
        </div>
        
        <PortfolioAnalyzer />
      </main>
    </div>
  );
}
