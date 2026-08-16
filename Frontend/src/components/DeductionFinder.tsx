"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Search, ChevronRight, Info, Sparkles } from "lucide-react";

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
    description: "The primary tax deduction for individuals covering investments and statutory savings.",
    maxLimit: "₹1,50,000",
    eligibleInvestments: ["ELSS Mutual Funds", "PPF", "EPF", "LIC Premiums", "Home Loan Principal", "Tuition Fees"],
  },
  {
    id: "80d",
    name: "Section 80D",
    description: "Deduction for medical insurance premiums paid for self, spouse, children, and senior parents.",
    maxLimit: "₹25,000 - ₹1,00,000",
    eligibleInvestments: ["Health Insurance Premium", "Preventive Health Checkup (₹5,000)", "Senior Citizen Medical"],
  },
  {
    id: "hra",
    name: "HRA Exemption (Sec 10(13A))",
    description: "House Rent Allowance exemption for salaried individuals living in rented accommodations.",
    maxLimit: "Least of Actual HRA, 50%/40% Salary, or Rent - 10% Salary",
    eligibleInvestments: ["Actual Rent Paid", "Rent Agreement", "Rent Receipts (PAN if rent > ₹1L/yr)"],
  },
  {
    id: "80ccd1b",
    name: "Section 80CCD(1B)",
    description: "Exclusive additional deduction for contribution to National Pension Scheme (NPS).",
    maxLimit: "₹50,000 (Over & above 80C)",
    eligibleInvestments: ["NPS Tier-I Account", "Atal Pension Yojana"],
  },
  {
    id: "24b",
    name: "Section 24(b)",
    description: "Deduction on the interest paid for home loan of self-occupied residential property.",
    maxLimit: "₹2,00,000",
    eligibleInvestments: ["Home Loan Interest Certificate from Bank"],
  },
  {
    id: "80e",
    name: "Section 80E",
    description: "Deduction on the interest paid for higher education loans (no upper limit for 8 consecutive years).",
    maxLimit: "100% of Interest Paid",
    eligibleInvestments: ["Higher Education Loan Interest Certificate"],
  },
  {
    id: "80tta",
    name: "Section 80TTA / 80TTB",
    description: "Deduction on interest earned from savings bank accounts (80TTB ₹50k for senior citizens).",
    maxLimit: "₹10,000 (₹50,000 for Seniors)",
    eligibleInvestments: ["Savings Bank Account Interest", "Co-operative Bank Interest"],
  },
  {
    id: "80g",
    name: "Section 80G",
    description: "Deduction for donations made to PMNRF, NDRF, and approved charitable institutions.",
    maxLimit: "50% or 100% with Qualifying Limit",
    eligibleInvestments: ["Approved 80G Receipts with 10BE Certificate"],
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 15,
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
    scale: 0.9,
    transition: {
      duration: 0.15,
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
        className={`grid w-full h-full min-h-[220px] rounded-3xl transition-all duration-500 preserve-3d cursor-pointer ${
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        } group`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front Side */}
        <div className="[grid-area:1/1] backface-hidden w-full h-full">
          <div className="h-full w-full p-6 bg-card border border-border rounded-3xl shadow-xs transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-lg group-hover:border-primary/50 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-black text-foreground tracking-tight">{deduction.name}</h3>
                <div className="p-2 bg-muted rounded-full">
                  <Info size={16} className="text-muted-foreground" />
                </div>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed font-medium">
                {deduction.description}
              </p>
            </div>
            
            <div className="mt-5 flex items-center justify-between text-primary font-bold text-xs pt-3 border-t border-border/40">
              <span>Click to view statutory limits</span>
              <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>

        {/* Back Side */}
        <div className="[grid-area:1/1] backface-hidden w-full h-full [transform:rotateY(180deg)]">
           <div className="h-full w-full p-6 bg-foreground text-background border border-border rounded-3xl shadow-lg flex flex-col justify-between">
             <div>
               <div className="mb-3 pb-2 border-b border-background/20">
                 <h4 className="text-[11px] font-black uppercase tracking-wider opacity-70 mb-0.5">Statutory Max Limit</h4>
                 <p className="text-xl font-black">{deduction.maxLimit}</p>
               </div>
               
               <div>
                 <h4 className="text-[11px] font-black uppercase tracking-wider opacity-70 mb-2">Eligible Investments</h4>
                 <ul className="space-y-1">
                   {deduction.eligibleInvestments.map((inv, idx) => (
                     <li key={idx} className="flex items-center gap-2 text-xs font-bold">
                       <span className="size-1.5 bg-background rounded-full shrink-0"></span>
                       <span className="opacity-90">{inv}</span>
                     </li>
                   ))}
                 </ul>
               </div>
             </div>

             <div className="mt-4 pt-2 border-t border-background/20 text-[11px] font-bold opacity-75 flex items-center justify-between">
               <span>Click to flip back</span>
               <ChevronRight size={12} />
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
    <section id="deductions" className="py-24 px-6 lg:px-12 relative z-10 bg-card/40 border-b border-border/40 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider mb-4">
              <Sparkles size={13} />
              <span>Chapter VI-A Explorer</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black mb-3 leading-tight text-foreground tracking-tight">
              Tax Deduction <span className="text-primary">Finder</span>
            </h2>
            <p className="text-sm md:text-base text-muted-foreground font-medium">
              Explore eligible exemptions under Section 80C, 80D, HRA, 80CCD, and Section 24(b). Flip any card for statutory limits.
            </p>
          </div>
          
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-muted-foreground" size={18} />
            </div>
            <input
              type="text"
              placeholder="Search sections (80C, 80D, HRA, NPS)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-full text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all text-xs font-bold shadow-xs"
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
          <div className="py-16 text-center text-muted-foreground font-bold text-sm bg-card rounded-3xl border border-border">
            No deductions found matching &quot;{searchTerm}&quot;. Try searching for 80C, 80D, HRA, or NPS.
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
