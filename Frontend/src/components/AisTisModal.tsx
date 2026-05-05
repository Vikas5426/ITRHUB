"use client";

import React, { useState } from 'react';
import { X, FileText, Copy, ExternalLink, Check } from 'lucide-react';

interface AisTisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AisTisModal({ isOpen, onClose }: AisTisModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText("abcde1234f01011990");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 font-sans">
      {/* Modal Container */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl w-full max-w-[24rem] sm:max-w-sm overflow-hidden flex flex-col relative border border-gray-100 dark:border-zinc-800">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 z-10"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gray-100 dark:bg-zinc-800 p-2.5 rounded-2xl">
              <FileText className="text-gray-800 dark:text-gray-200" size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">AIS / TIS</h2>
          </div>

          {/* Section 1 */}
          <div className="mb-5">
            <h3 className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">
              Brief Summary
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Annual Information Statement (AIS) and Taxpayer Information Summary (TIS) provide a high-definition report of all your financial transactions.
            </p>
          </div>

          {/* Section 2 */}
          <div className="mb-6">
            <h3 className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">
              The &quot;Why&quot;
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Ensures no income is forgotten or mismatched with the Income Tax Department&apos;s records, preventing future notices.
            </p>
          </div>

          {/* Section 3 (Highlight Box) */}
          <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-zinc-700/50 p-4 mt-4">
            <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase mb-2">
              Password Hint
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              PAN (lowercase) + Date of Birth (DDMMYYYY)
            </p>
            <button 
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-gray-200/50 dark:bg-zinc-700/50 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
            >
              {copied ? <Check size={14} className="text-green-600 dark:text-green-400" /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy Example PAN"}
            </button>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-6 pt-0 mt-2">
          <a 
            href="https://eportal.incometax.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200 transition-colors"
          >
            Open Official Portal
            <ExternalLink size={16} />
          </a>
        </div>
        
      </div>
    </div>
  );
}
