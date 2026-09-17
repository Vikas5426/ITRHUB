import Link from "next/link";
import { ArrowRight, FileSpreadsheet, ShieldAlert, Sparkles, TrendingUp, UploadCloud } from "lucide-react";

import { ProductPageShell } from "@/components/product/ProductPageShell";
import { AuthGate } from "@/components/auth/AuthGate";
import { PortfolioPreview } from "@/components/PortfolioPreview";

export const metadata = {
  title: "Portfolio Snap | ITRHUB",
  description: "Real-time asset allocation, multi-broker capital gains calculations, and Section 112A grandfathering relief.",
};

const portfolioHighlights = [
  "Multi-asset allocation (Equity, Debt, Real Estate)",
  "New Budget capital gains tax rates (LTCG @ 12.5%, STCG @ 20%)",
  "₹1.25 Lakh aggregate annual LTCG exemption",
  "Section 55(2)(ac) grandfathering relief for pre-2018 holdings",
  "Broker trade sheet CSV/CAS ingestion (Zerodha, Groww, Upstox)",
];

export default function PortfolioPage() {
  return (
    <ProductPageShell
      eyebrow="Capital Gains & Investments"
      title="Portfolio Snap"
      description="Interactive portfolio overview, capital gains categorization, and tax-loss harvesting suggestions for Indian investors."
      sideTitle="Portfolio Scope"
      sideItems={portfolioHighlights}
    >
      <AuthGate
        featureTitle="Portfolio Snap & Capital Gains"
        featureDescription="Sign in to link your brokerage trade sheets, calculate STCG/LTCG, claim grandfathering relief, and optimize investment tax."
        highlights={[
          "Auto-categorization of Short-Term (20%/15%) and Long-Term (12.5%/10%) gains",
          "Automated ₹1.25 Lakh Section 112A exemption computation",
          "Grandfathering relief for equity acquired before January 31, 2018",
          "Loss harvesting and 8-year loss carry-forward tracking",
        ]}
      >
        <div className="space-y-8">
          <div className="rounded-3xl border border-border bg-card p-4 sm:p-8 shadow-sm">
            <PortfolioPreview />
          </div>

          {/* Quick Actions Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <UploadCloud size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">Import Broker Trade Sheets</h3>
                  <p className="text-xs text-muted-foreground">Upload Zerodha, Groww, Upstox, or CAMS statements</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                Directly ingest your capital gains statements and CAS files into your encrypted return vault to auto-fill Schedule CG.
              </p>
              <Link
                href="/intake?section=documents"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
              >
                <span>Upload Statements in Intake</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">Deep Capital Gains Analysis</h3>
                  <p className="text-xs text-muted-foreground">Granular holding period & tax liability breakdown</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                Examine your tax liability under the revised Budget rates, review grandfathering benefits, and check loss set-off rules.
              </p>
              <Link
                href="/analysis?section=investments"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 hover:bg-muted px-5 py-2.5 text-xs font-bold text-foreground transition-all shadow-xs"
              >
                <span>Open Analysis Hub</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </AuthGate>
    </ProductPageShell>
  );
}
