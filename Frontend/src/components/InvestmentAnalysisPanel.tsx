"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, FileSpreadsheet, TrendingUp } from "lucide-react";

import { PORTFOLIO_ANALYSIS_STORAGE_KEY } from "@/lib/storageKeys";

type TradeData = {
  id: number;
  name: string;
  type: string;
  days: number;
  gain: number;
  tax: number;
  bd: string;
  sd: string;
  cat: string;
};

type StoredPortfolioAnalysis = {
  source: string;
  generatedAt: string;
  trades: TradeData[];
};

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function readAnalysis() {
  try {
    const raw = window.localStorage.getItem(PORTFOLIO_ANALYSIS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredPortfolioAnalysis) : null;
  } catch {
    return null;
  }
}

export function InvestmentAnalysisPanel() {
  const [analysis, setAnalysis] = useState<StoredPortfolioAnalysis | null>(null);

  useEffect(() => {
    const sync = () => setAnalysis(readAnalysis());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("itrhub:portfolio-analysis-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("itrhub:portfolio-analysis-updated", sync);
    };
  }, []);

  const totals = useMemo(() => {
    const trades = analysis?.trades ?? [];
    return {
      tradeCount: trades.length,
      gains: trades.reduce((sum, trade) => sum + Math.max(0, trade.gain), 0),
      losses: Math.abs(trades.reduce((sum, trade) => sum + Math.min(0, trade.gain), 0)),
      tax: trades.reduce((sum, trade) => sum + trade.tax, 0),
      byCategory: trades.reduce<Record<string, { gains: number; tax: number; count: number }>>((summary, trade) => {
        const current = summary[trade.cat] ?? { gains: 0, tax: 0, count: 0 };
        summary[trade.cat] = {
          gains: current.gains + trade.gain,
          tax: current.tax + trade.tax,
          count: current.count + 1,
        };
        return summary;
      }, {}),
    };
  }, [analysis]);

  if (!analysis || analysis.trades.length === 0) {
    return (
      <div className="minimal-card p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Investment analysis</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">No broker/CAS analysis yet.</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Upload broker, CAMS, CAS, or tax P&L data in Intake. Analysis will then show capital gains, losses, categories, and estimated tax impact here without asking for the same file again.
            </p>
          </div>
          <Link
            href="/intake?section=investments"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
          >
            Open investment intake
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  const generatedAt = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(analysis.generatedAt));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Trades reviewed" value={String(totals.tradeCount)} />
        <MetricCard label="Total gains" value={currency(totals.gains)} />
        <MetricCard label="Losses detected" value={currency(totals.losses)} />
        <MetricCard label="Estimated tax" value={currency(totals.tax)} tone={totals.tax > 0 ? "red" : "default"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="minimal-card p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Saved from Intake</p>
              <h2 className="mt-1 text-2xl font-black">Capital gains summary</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Source: <span className="font-bold text-foreground">{analysis.source}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Generated: {generatedAt}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {Object.entries(totals.byCategory).map(([category, item]) => (
              <div key={category} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-black">{category}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.count} trade(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black">{currency(item.gains)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Tax {currency(item.tax)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Link href="/intake?section=investments" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary underline underline-offset-4">
            Update broker data in Intake
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="minimal-card overflow-hidden p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Trade-level review</p>
              <h2 className="mt-1 text-2xl font-black">Imported positions</h2>
            </div>
            <FileSpreadsheet className="text-muted-foreground" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2">Asset</th>
                  <th className="py-2">Category</th>
                  <th className="py-2">Holding</th>
                  <th className="py-2 text-right">Gain/Loss</th>
                  <th className="py-2 text-right">Tax impact</th>
                </tr>
              </thead>
              <tbody>
                {analysis.trades.map((trade) => (
                  <tr key={trade.id} className="border-t border-border">
                    <td className="py-3">
                      <p className="font-bold">{trade.name}</p>
                      <p className="text-xs text-muted-foreground">{trade.type}</p>
                    </td>
                    <td className="py-3 font-bold">{trade.cat}</td>
                    <td className="py-3 text-muted-foreground">{trade.days} days</td>
                    <td className={`py-3 text-right font-black ${trade.gain < 0 ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}>
                      {currency(trade.gain)}
                    </td>
                    <td className="py-3 text-right font-black">{currency(trade.tax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "red" }) {
  return (
    <div className={`rounded-3xl border p-5 ${tone === "red" ? "border-red-500/20 bg-red-500/10" : "border-border bg-card"}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}
