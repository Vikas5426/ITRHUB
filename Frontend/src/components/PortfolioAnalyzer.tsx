"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileSpreadsheet, X, ShieldAlert } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, ReferenceLine } from 'recharts';

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
  comp?: {
    opt1: number;
    opt2: number;
    chosen: number;
  };
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: TradeData }>;
};

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const p = payload[0].payload;
    return (
      <div className="bg-black/90 backdrop-blur-md text-white p-4 rounded-xl border border-white/20 shadow-xl max-w-[250px]">
        <p className="font-bold text-lg mb-1">{p.name}</p>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{p.type}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${p.cat === 'LTCG' ? 'bg-blue-500/30 text-blue-300' : p.cat === 'STCG' ? 'bg-orange-500/30 text-orange-300' : p.cat === 'Loss' ? 'bg-red-500/30 text-red-300' : 'bg-purple-500/30 text-purple-300'}`}>{p.cat}</span>
        </div>
        <p className="text-sm text-gray-300">Gain: <span className="text-green-400 font-bold">Rs {p.gain.toLocaleString('en-IN')}</span></p>
        <p className="text-sm text-gray-300 mb-2">Tax: <span className="text-red-400 font-bold">Rs {p.tax.toLocaleString('en-IN')}</span></p>
        <p className="text-xs text-gray-500 mt-2 border-t border-white/10 pt-2">Click bubble for details</p>
      </div>
    );
  }

  return null;
}

export function PortfolioAnalyzer() {
  const [data, setData] = useState<TradeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<TradeData | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = async (f: File) => {
    setLoading(true);
    try {
      const text = await f.text();
      // send as JSON with csv_text for easier integration
      const res = await fetch("/api/portfolio/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv_text: text }),
      });
      const result = await res.json();
      if (result.error) {
        alert("Error from server: " + result.error);
        return;
      }
      if (result.data) {
        if (result.data.length === 0) {
          alert("No valid trades could be parsed from your CSV. Please ensure you are using the correct columns:\nAsset Name, Asset Type, Buy Date, Sell Date, Buy Price, Sell Price, Quantity");
        }
        setData(result.data);
      }
    } catch (err) {
      console.error(err);
      // Fallback dummy data for preview if backend isn't running
      const dummy: TradeData[] = [
        { id: 1, name: "Reliance Ind", type: "Listed Equity", days: 400, gain: 150000, tax: 3250, bd: "2023-01-10", sd: "2024-02-14", cat: "LTCG" },
        { id: 2, name: "TCS", type: "Listed Equity", days: 200, gain: 80000, tax: 16640, bd: "2023-08-10", sd: "2024-02-26", cat: "STCG" },
        { id: 3, name: "HDFC Liquid", type: "Debt Mutual Fund", days: 100, gain: 20000, tax: 6240, bd: "2023-11-01", sd: "2024-02-09", cat: "Slab" },
        { id: 4, name: "Navi Mumbai Flat", type: "Real Estate", days: 850, gain: 2500000, tax: 325000, bd: "2022-01-10", sd: "2024-05-10", cat: "LTCG", comp: { opt1: 312500, opt2: 350000, chosen: 312500 } },
        { id: 5, name: "Infosys", type: "Listed Equity", days: 450, gain: -20000, tax: 0, bd: "2022-10-10", sd: "2024-01-03", cat: "Loss" },
      ];
      setData(dummy);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full relative">
      {!data.length ? (
        <div 
          className={`w-full max-w-2xl mx-auto border-2 border-dashed rounded-3xl p-12 text-center transition-all ${dragActive ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 hover:border-primary hover:bg-gray-100 dark:hover:bg-white/10'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
            <UploadCloud size={40} className="text-primary" />
          </div>
          <h3 className="text-2xl font-black text-black dark:text-white mb-2">Upload your CAMS/CAS Statement</h3>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">Drag and drop your portfolio CSV file here, or click to browse. We will instantly analyze your tax liabilities.</p>
          
          <div className="flex justify-center gap-4 mb-6">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                const csvContent = "data:text/csv;charset=utf-8,Asset Name,Asset Type,Buy Date,Sell Date,Buy Price,Sell Price,Quantity\nReliance Ind,Listed Equity,2023-01-10,2024-02-14,2000,2500,300\nTCS,Listed Equity,2023-08-10,2024-02-26,3000,3400,200\nHDFC Liquid,Debt Mutual Fund,2023-11-01,2024-02-09,100,105,4000\nNavi Mumbai Flat,Real Estate,2022-01-10,2024-05-10,5000000,7500000,1";
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", "sample_portfolio.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="text-primary text-sm font-bold underline hover:text-primary/80 transition-colors"
            >
              Download Sample CSV Format
            </button>
          </div>

          <input type="file" id="csv-upload" className="hidden" accept=".csv" onChange={handleFileChange} />
          <label htmlFor="csv-upload" className="cursor-pointer bg-primary text-primary-foreground font-bold px-8 py-4 rounded-full shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
            {loading ? 'Analyzing...' : 'Browse CSV File'}
          </label>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Chart Section */}
          <div className="flex-1 minimal-card p-8 relative">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black text-black dark:text-white mb-1">Tax Impact Map</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Bubble size represents the total tax amount. Click a bubble to view trade details.</p>
              </div>
              <button onClick={() => setData([])} className="text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white flex items-center gap-2">
                <FileSpreadsheet size={16} /> New Upload
              </button>
            </div>
            
            <div className="h-[500px] w-full min-h-[500px] pt-8 focus:outline-none" style={{ outline: 'none' }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} style={{ outline: 'none' }}>
                <ScatterChart margin={{ top: 30, right: 30, bottom: 20, left: 30 }} style={{ outline: 'none' }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#888888" opacity={0.15} />
                  <XAxis 
                    type="number" 
                    dataKey="days" 
                    name="Holding Period" 
                    tick={{fill: '#888', fontSize: 12, fontWeight: 600}} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `${val} Days`}
                    tickMargin={10}
                    padding={{ left: 40, right: 40 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="gain" 
                    name="Capital Gains" 
                    tick={{fill: '#888', fontSize: 12, fontWeight: 600}} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => val >= 100000 ? `Rs ${(val/100000).toFixed(1)}L` : `Rs ${val.toLocaleString('en-IN')}`}
                    tickMargin={10}
                    width={80}
                    padding={{ top: 40, bottom: 40 }}
                  />
                  <ZAxis type="number" dataKey="tax" range={[100, 1500]} name="Tax Impact" />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    content={() => (
                      <div className="flex justify-center gap-6 text-sm font-bold mt-6">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div> LTCG (Long-Term)</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)]"></div> STCG (Short-Term)</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.6)]"></div> Slab Rate (Debt)</div>
                      </div>
                    )}
                  />

                  <ReferenceLine x={365} stroke="#3b82f6" strokeDasharray="3 3" opacity={0.5} label={{ position: 'insideTopLeft', value: '1 Yr (Equity)', fill: '#3b82f6', fontSize: 11, fontWeight: 'bold', dy: 15 }} />
                  <ReferenceLine x={730} stroke="#f97316" strokeDasharray="3 3" opacity={0.5} label={{ position: 'insideTopRight', value: '2 Yrs (Real Estate)', fill: '#f97316', fontSize: 11, fontWeight: 'bold', dy: 15 }} />

                  <Scatter name="Trades" data={data.filter(d => d.gain > 0)} onClick={(data) => setSelectedTrade(data.payload)}>
                    {data.filter(d => d.gain > 0).map((entry, index) => {
                      let color = '#8884d8';
                      if (entry.cat === 'LTCG') color = '#3b82f6';
                      if (entry.cat === 'STCG') color = '#f97316';
                      if (entry.cat === 'Slab') color = '#a855f7';
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={color} 
                          fillOpacity={0.8} 
                          stroke={color}
                          strokeWidth={2}
                          className="cursor-pointer transition-all hover:opacity-100" 
                          style={{ filter: `drop-shadow(0px 0px 8px ${color}80)` }} 
                        />
                      );
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Details Modal / Side Panel */}
          <AnimatePresence>
            {selectedTrade && (
              <motion.div
                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.95 }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                className="w-full lg:w-[400px] shrink-0"
              >
                <div className="minimal-card p-6 h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full pointer-events-none" />
                  
                  <div className="flex justify-between items-start mb-6">
                    <h4 className="text-xl font-black text-black dark:text-white leading-tight pr-8">{selectedTrade.name}</h4>
                    <button onClick={() => setSelectedTrade(null)} className="p-2 bg-gray-100 dark:bg-white/10 rounded-full hover:bg-gray-200 dark:hover:bg-white/20 transition-colors text-black dark:text-white">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-8">
                    <span className="bg-gray-100 dark:bg-white/10 text-black dark:text-white px-3 py-1 rounded-full text-xs font-bold">{selectedTrade.type}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedTrade.cat === 'LTCG' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' : selectedTrade.cat === 'STCG' ? 'bg-orange-500/20 text-orange-700 dark:text-orange-300' : selectedTrade.cat === 'Loss' ? 'bg-red-500/20 text-red-700 dark:text-red-300' : 'bg-purple-500/20 text-purple-700 dark:text-purple-300'}`}>
                      {selectedTrade.cat}
                    </span>
                    <span className="bg-gray-100 dark:bg-white/10 text-black dark:text-white px-3 py-1 rounded-full text-xs font-bold">{selectedTrade.days} Days Held</span>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-white/10">
                      <span className="text-gray-500 dark:text-gray-400 font-medium text-sm">Buy Date</span>
                      <span className="font-bold text-black dark:text-white">{selectedTrade.bd}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-white/10">
                      <span className="text-gray-500 dark:text-gray-400 font-medium text-sm">Sell Date</span>
                      <span className="font-bold text-black dark:text-white">{selectedTrade.sd}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-white/10">
                      <span className="text-gray-500 dark:text-gray-400 font-medium text-sm">Capital Gain</span>
                      <span className="font-bold text-green-600 dark:text-green-400">Rs {selectedTrade.gain.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-white/10">
                      <span className="text-gray-500 dark:text-gray-400 font-medium text-sm">Est. Tax Impact</span>
                      <span className="font-black text-red-600 dark:text-red-400 text-lg">Rs {selectedTrade.tax.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {selectedTrade.comp && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 mt-auto">
                      <div className="flex items-center gap-2 mb-3 text-yellow-700 dark:text-yellow-500">
                        <ShieldAlert size={18} />
                        <span className="font-bold text-sm">Grandfathering Comparison</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Since this property was bought before July 23, 2024, you can choose the lower tax regime:</p>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-500 dark:text-gray-400">12.5% (No Indexation)</span>
                          <span className="font-bold text-black dark:text-white">Rs {selectedTrade.comp.opt1.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-500 dark:text-gray-400">20% (With Indexation)</span>
                          <span className="font-bold text-black dark:text-white">Rs {selectedTrade.comp.opt2.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-yellow-500/20 flex justify-between items-center">
                        <span className="text-xs font-bold text-yellow-700 dark:text-yellow-500">Optimal Tax Applied</span>
                        <span className="text-sm font-black text-yellow-700 dark:text-yellow-500">Rs {selectedTrade.comp.chosen.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
