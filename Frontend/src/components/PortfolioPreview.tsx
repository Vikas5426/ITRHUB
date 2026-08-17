"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowRight, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useTheme } from "next-themes";
import { useMemo, useState, useEffect } from "react";

const lightData = [
  { name: "Equity", value: 65, color: "#000000" },
  { name: "Debt", value: 25, color: "#52525B" },
  { name: "Real Estate", value: 10, color: "#A1A1AA" },
];

const darkData = [
  { name: "Equity", value: 65, color: "#FFFFFF" },
  { name: "Debt", value: 25, color: "#A1A1AA" },
  { name: "Real Estate", value: 10, color: "#52525B" },
];

export function PortfolioPreview() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const data = useMemo(
    () => (mounted && resolvedTheme === "dark" ? darkData : lightData),
    [mounted, resolvedTheme]
  );
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <section className="py-20 px-6 lg:px-12 relative z-10">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        {/* Left Side: Mockup Card */}
        <motion.div 
          className="flex-1 w-full"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="minimal-card p-8 floating-anim relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none opacity-0 dark:opacity-100 transition-opacity" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h3 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
                  <Wallet className="text-black dark:text-primary" /> Portfolio Snap
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real-time asset allocation</p>
              </div>
              <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-transparent dark:border-green-500/20 text-sm font-bold flex items-center gap-1">
                <TrendingUp size={14} /> +12.4%
              </div>
            </div>

            <div className="h-64 w-full relative z-10">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      itemStyle={{ color: isDark ? '#F8FAFC' : '#000000', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full rounded-full bg-muted/40" />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-foreground">₹24.5L</span>
                <span className="text-xs font-bold text-muted-foreground">Total Portfolio</span>
              </div>
            </div>

            <div className="mt-6 space-y-3 relative z-10">
              {data.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-bold text-foreground">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Side: Copy */}
        <motion.div 
          className="flex-1"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl lg:text-5xl font-black mb-6 leading-tight text-foreground tracking-tight">
            Connect brokers. <br/>
            <span className="text-primary">Harvest tax losses.</span>
          </h2>
          <p className="text-base text-muted-foreground font-medium mb-8 leading-relaxed">
            Ingest trade CSVs and CAS reports from Zerodha, Groww, Upstox, and Angel One. We automatically calculate Short-term (STCG 20%) and Long-term (LTCG 12.5%) gains, grandfathering relief, and suggest tax-loss harvesting.
          </p>
          
          <div className="space-y-4">
            <div className="minimal-card p-5 flex items-center justify-between border-l-4 border-l-red-500">
              <div>
                <h4 className="font-black text-sm text-foreground">Unrealized Capital Losses</h4>
                <p className="text-xs font-medium text-muted-foreground">Available to offset taxable STCG/LTCG</p>
              </div>
              <span className="text-red-600 dark:text-red-400 font-mono font-black text-base flex items-center gap-1">
                <TrendingDown size={18} /> ₹45,200
              </span>
            </div>
            <div className="minimal-card p-5 flex items-center justify-between border-l-4 border-l-green-500">
              <div>
                <h4 className="font-black text-sm text-foreground">Estimated Tax Saved YTD</h4>
                <p className="text-xs font-medium text-muted-foreground">Via intelligent loss harvesting</p>
              </div>
              <span className="text-green-600 dark:text-green-400 font-mono font-black text-base flex items-center gap-1">
                <TrendingUp size={18} /> ₹12,500
              </span>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/intake?section=connections"
                className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
              >
                <span>Connect Broker CSV</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/analysis?section=investments"
                className="flex items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-xs font-bold text-foreground hover:bg-muted transition-all"
              >
                <span>View Capital Gains Analysis</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
