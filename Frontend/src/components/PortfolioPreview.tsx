"use client";

import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

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
    setMounted(true);
  }, []);

  const data = mounted && resolvedTheme === "dark" ? darkData : lightData;

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
                      backgroundColor: mounted && resolvedTheme === 'dark' ? '#0F172A' : '#FFFFFF', 
                      borderColor: mounted && resolvedTheme === 'dark' ? 'rgba(255,255,255,0.1)' : '#E5E7EB', 
                      borderRadius: '12px', 
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                    }}
                    itemStyle={{ color: mounted && resolvedTheme === 'dark' ? '#F8FAFC' : '#000000', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-black dark:text-white">₹24.5L</span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total Value</span>
              </div>
            </div>

            <div className="mt-6 space-y-4 relative z-10">
              {data.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-bold text-black dark:text-white">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{item.value}%</span>
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
          <h2 className="text-5xl font-black mb-6 leading-tight dark:text-white">
            Connect brokers. <br/>
            <span className="dark:text-primary">Harvest losses.</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium mb-8">
            Sync your Zerodha, Groww, or Upstox accounts instantly. We automatically calculate Long-term (LTCG) and Short-term (STCG) capital gains and identify tax-saving opportunities.
          </p>
          
          <div className="space-y-4">
            <div className="minimal-card p-5 flex items-center justify-between border-l-4 border-l-red-500 dark:border-l-red-400">
              <div>
                <h4 className="font-bold text-black dark:text-white">Unrealized Losses</h4>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Available to offset gains</p>
              </div>
              <span className="text-red-600 dark:text-red-400 font-mono font-bold text-lg flex items-center gap-1">
                <TrendingDown size={18} /> ₹45,200
              </span>
            </div>
            <div className="minimal-card p-5 flex items-center justify-between border-l-4 border-l-green-500 dark:border-l-green-400">
              <div>
                <h4 className="font-bold text-black dark:text-white">Tax Saved YTD</h4>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Via loss harvesting</p>
              </div>
              <span className="text-green-600 dark:text-green-400 font-mono font-bold text-lg flex items-center gap-1">
                <TrendingUp size={18} /> ₹12,500
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
