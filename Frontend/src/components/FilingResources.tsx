"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, MessageSquare, ShieldCheck, Zap } from "lucide-react";
import { AisTisModal } from "./AisTisModal";

export function FilingResources() {
  const [isAisModalOpen, setIsAisModalOpen] = useState(false);

  return (
    <section className="py-20 px-6 lg:px-12 relative z-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Left Column: Resources */}
          <div className="flex-1 space-y-8">
            <div>
              <h2 className="text-5xl font-black mb-4 leading-tight text-black dark:text-white">Everything you need to file.</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                Guides, checklists, and secure document management. All in one place.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 minimal-card hover:border-black/20 dark:hover:bg-white/5 transition-all cursor-pointer group">
                <FileText className="text-black dark:text-primary mb-4" size={28} />
                <h4 className="text-lg font-bold mb-2 text-black dark:text-white group-hover:text-black dark:group-hover:text-primary transition-colors">Form 16 Guide</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">How to read your Form 16 and cross-check with 26AS.</p>
              </div>
              <div 
                onClick={() => setIsAisModalOpen(true)}
                className="p-6 minimal-card hover:border-black/20 dark:hover:bg-white/5 transition-all cursor-pointer group"
              >
                <ShieldCheck className="text-black dark:text-primary mb-4" size={28} />
                <h4 className="text-lg font-bold mb-2 text-black dark:text-white group-hover:text-black dark:group-hover:text-primary transition-colors">AIS Verification</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Ensure your Annual Information Statement matches your records.</p>
              </div>
              <div className="p-6 minimal-card hover:border-black/20 dark:hover:bg-white/5 transition-all cursor-pointer group sm:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-bold mb-1 text-black dark:text-white">Deduction Finder Checklist</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">80C, 80D, HRA, NPS & more.</p>
                  </div>
                  <button className="p-3 bg-gray-100 dark:bg-white/10 rounded-full hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                    <Download size={20} className="text-black dark:text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Chat */}
          <div className="flex-1 lg:max-w-md">
            <div className="minimal-card p-6 h-full flex flex-col relative overflow-hidden bg-white dark:bg-transparent group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full pointer-events-none opacity-0 dark:opacity-100 transition-opacity" />
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-primary/20 flex items-center justify-center">
                  <Zap size={20} className="text-black dark:text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-black dark:text-white">Claude AI Assistant</h4>
                  <p className="text-xs text-green-600 dark:text-green-400 font-bold">Online & Ready</p>
                </div>
              </div>

              <div className="flex-1 space-y-4 mb-6 relative z-10">
                <div className="bg-gray-100 dark:bg-white/5 p-4 rounded-2xl rounded-tl-sm text-sm font-medium text-black dark:text-white inline-block">
                  Hi! I'm your tax assistant. How can I help you today?
                </div>
                <div className="bg-black dark:bg-primary/20 p-4 rounded-2xl rounded-tr-sm text-sm font-medium text-white block ml-auto w-fit shadow-md dark:border dark:border-primary/30">
                  Can I claim HRA and Home Loan both?
                </div>
                <div className="bg-gray-100 dark:bg-white/5 p-4 rounded-2xl rounded-tl-sm text-sm font-medium text-black dark:text-white inline-block">
                  Yes, you can! If you are living in a rented house and paying EMI for a home loan in a different city, you can claim both HRA (Sec 10(13A)) and Home Loan Interest (Sec 24).
                </div>
              </div>

              <div className="mt-auto relative z-10">
                <input 
                  type="text" 
                  placeholder="Ask a tax question..." 
                  className="w-full bg-white dark:bg-black/40 border-2 dark:border border-gray-200 dark:border-white/10 rounded-xl py-4 pl-4 pr-12 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-primary/50 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-muted-foreground transition-colors"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black dark:bg-primary text-white dark:text-primary-foreground rounded-lg hover:bg-gray-800 transition-colors">
                  <MessageSquare size={18} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <AisTisModal 
        isOpen={isAisModalOpen} 
        onClose={() => setIsAisModalOpen(false)} 
      />
    </section>
  );
}
