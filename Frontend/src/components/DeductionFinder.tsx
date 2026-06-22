"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Search, ChevronRight, Info } from "lucide-react";

interface Deduction {
  id: string;
  name: string;
  description: string;
  maxLimit: string;
  eligibleInvestments: string[];
}

const DEDUCTIONS: Deduction[] = [
  {
    id: "80c",
    name: "Section 80C",
    description: "The most popular deduction for tax-saving investments and expenses.",
    maxLimit: "Rs 1,50,000",
    eligibleInvestments: ["ELSS Mutual Funds", "PPF", "EPF", "LIC Premiums", "Home Loan Principal", "Tuition Fees"],
  },
  {
    id: "80d",
    name: "Section 80D",
    description: "Deduction for medical insurance premiums paid for self and family.",
    maxLimit: "Rs 25,000 - Rs 1,00,000",
    eligibleInvestments: ["Health Insurance Premium", "Preventive Health Checkup"],
  },
  {
    id: "hra",
    name: "HRA Exemption",
    description: "House Rent Allowance exemption for salaried individuals living in rented houses.",
    maxLimit: "Based on salary & rent",
    eligibleInvestments: ["Actual Rent Paid", "Rent Agreement", "Rent Receipts"],
  },
  {
    id: "80ccd1b",
    name: "Section 80CCD(1B)",
    description: "Additional deduction for contribution to National Pension Scheme (NPS).",
    maxLimit: "Rs 50,000",
    eligibleInvestments: ["NPS Tier-I Account"],
  },
  {
    id: "24b",
    name: "Section 24(b)",
    description: "Deduction on the interest paid for a home loan.",
    maxLimit: "Rs 2,00,000",
    eligibleInvestments: ["Home Loan Interest Portion"],
  },
  {
    id: "80e",
    name: "Section 80E",
    description: "Deduction on the interest paid on an education loan.",
    maxLimit: "No upper limit",
    eligibleInvestments: ["Education Loan Interest"],
  },
  {
    id: "80tta",
    name: "Section 80TTA",
    description: "Deduction on interest income from savings accounts.",
    maxLimit: "Rs 10,000",
    eligibleInvestments: ["Savings Account Interest"],
  },
  {
    id: "80g",
    name: "Section 80G",
    description: "Deduction for donations made to charitable funds and relief funds.",
    maxLimit: "50% or 100% of donation",
    eligibleInvestments: ["Approved Charitable Institutions", "Relief Funds"],
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 20,
  },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2,
    },
  },
};

function DeductionCard({ deduction }: { deduction: Deduction }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <motion.div
      variants={itemVariants}
      layout
      initial="hidden"
      animate="show"
      exit="exit"
      className="mb-6 break-inside-avoid perspective-1000"
    >
      <div
        className={`grid w-full h-full min-h-[220px] rounded-2xl transition-all duration-500 preserve-3d cursor-pointer ${
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        } group`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front Side */}
        <div className="[grid-area:1/1] backface-hidden w-full h-full">
          <div className="h-full w-full p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm transition-all duration-300 ease-out group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:group-hover:shadow-[0_20px_40px_-15px_rgba(var(--primary),0.2)] flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-black text-black dark:text-white tracking-tight">{deduction.name}</h3>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full">
                  <Info size={18} className="text-gray-400 dark:text-gray-500" />
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                {deduction.description}
              </p>
            </div>
            
            <div className="mt-6 flex items-center justify-between text-primary font-semibold text-sm">
              <span>Tap to flip</span>
              <ChevronRight size={16} />
            </div>
          </div>
        </div>

        {/* Back Side */}
        <div className="[grid-area:1/1] backface-hidden w-full h-full [transform:rotateY(180deg)]">
           <div className="h-full w-full p-6 bg-primary dark:bg-primary/10 border border-primary/20 rounded-2xl shadow-sm transition-all duration-300 ease-out group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_-15px_rgba(var(--primary),0.3)] flex flex-col text-white dark:text-foreground">
             <div className="mb-4">
               <h4 className="text-sm font-bold text-white/80 dark:text-primary uppercase tracking-wider mb-1">Max Limit</h4>
               <p className="text-xl font-black">{deduction.maxLimit}</p>
             </div>
             
             <div className="flex-1">
               <h4 className="text-sm font-bold text-white/80 dark:text-primary uppercase tracking-wider mb-2">Eligible Investments</h4>
               <ul className="space-y-1.5">
                 {deduction.eligibleInvestments.map((inv, idx) => (
                   <li key={idx} className="flex items-center gap-2 text-sm font-medium">
                     <span className="w-1.5 h-1.5 bg-white dark:bg-primary rounded-full shrink-0"></span>
                     <span className="opacity-90">{inv}</span>
                   </li>
                 ))}
               </ul>
             </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}

export function DeductionFinder() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDeductions = useMemo(() => {
    return DEDUCTIONS.filter((d) => 
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      d.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.eligibleInvestments.some(inv => inv.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm]);

  return (
    <section id="deductions" className="py-24 px-6 lg:px-12 relative z-10 bg-white dark:bg-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-5xl font-black mb-4 leading-tight text-black dark:text-white">
              Deduction <span className="text-primary">Finder</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
              Discover all tax-saving opportunities. Flip a card to see the max limit and where to invest.
            </p>
          </div>
          
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={20} />
            </div>
            <input
              type="text"
              placeholder="Search sections or investments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
            />
          </div>
        </div>

        <motion.div 
          className="columns-1 sm:columns-2 lg:columns-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence mode="popLayout">
            {filteredDeductions.map((deduction) => (
              <DeductionCard key={deduction.id} deduction={deduction} />
            ))}
          </AnimatePresence>
        </motion.div>
        
        {filteredDeductions.length === 0 && (
          <div className="py-12 text-center text-gray-500 font-medium">
            No deductions found matching &quot;{searchTerm}&quot;. Try a different term.
          </div>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
      `}} />
    </section>
  );
}
