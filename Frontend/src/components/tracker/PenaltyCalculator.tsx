"use client";

import { useState } from "react";
import { Calculator, IndianRupee } from "lucide-react";

export function PenaltyCalculator() {
  const [income, setIncome] = useState<string>("");

  // Very simple mock calculation: 
  // If income > 5L, late fee is 5000, else 1000.
  // Add 1% interest per month for 3 months as an example "exposure".
  const calculatePenalty = () => {
    if (!income || isNaN(Number(income))) return 0;
    const inc = Number(income);
    let lateFee = inc > 500000 ? 5000 : 1000;
    
    // roughly mock tax liability at 10%
    const taxLiability = inc > 300000 ? (inc - 300000) * 0.1 : 0;
    const interest = taxLiability * 0.01 * 3; // 3 months

    return Math.round(lateFee + interest);
  };

  const exposure = calculatePenalty();

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200 sticky top-24">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 p-2 rounded-xl text-primary">
          <Calculator size={24} />
        </div>
        <h3 className="text-xl font-bold">What's at stake?</h3>
      </div>

      <p className="text-sm text-gray-500 mb-6 leading-relaxed">
        Estimate your potential late fee and interest exposure if you miss the July 31 deadline.
      </p>

      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Estimated Annual Income
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <IndianRupee size={16} className="text-gray-400" />
            </div>
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="e.g. 1500000"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-black focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-center">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
          Estimated Exposure
        </div>
        <div className="text-3xl font-black text-red-500 mb-2">
          ₹{exposure.toLocaleString('en-IN')}
        </div>
        <div className="text-xs font-medium text-gray-400">
          Includes Sec 234F late fee + Sec 234A/B/C interest estimates.
        </div>
      </div>
    </div>
  );
}
