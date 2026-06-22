import Link from "next/link";
import { Hexagon, LockKeyhole, ShieldCheck } from "lucide-react";

import { footerCompanyLinks, footerResourceLinks } from "@/lib/navigation";

export function Footer() {
  return (
    <footer className="bg-[#f0f0f0] dark:bg-zinc-950 border-t border-[#e0e0e0] dark:border-zinc-800 pt-16 pb-10">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Hexagon className="text-primary" fill="currentColor" size={28} />
              <span className="text-xl font-black tracking-tight text-black dark:text-white uppercase">ITRHUB</span>
            </div>
            <p className="font-bold text-black dark:text-white text-lg">Everything you need to file.</p>
            <p className="text-[#666] dark:text-gray-400 text-sm leading-relaxed max-w-sm">
              Guides, checklists, income capture, and secure document management. All in one place.
            </p>
            <div className="mt-2 grid gap-2 text-xs font-bold text-[#666] dark:text-gray-400">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d7d7d7] px-3 py-2 dark:border-zinc-800">
                <ShieldCheck size={14} />
                Built for Indian ITR workflows
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d7d7d7] px-3 py-2 dark:border-zinc-800">
                <LockKeyhole size={14} />
                Private workspace first
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-black dark:text-white mb-6">Filing Flow</h3>
            <ul className="flex flex-col gap-3">
              {footerResourceLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-[#666] hover:text-[#0f0f0f] dark:text-gray-400 dark:hover:text-white transition-colors text-sm font-medium">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-black dark:text-white mb-6">Tools</h3>
            <ul className="flex flex-col gap-3">
              {footerCompanyLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-[#666] hover:text-[#0f0f0f] dark:text-gray-400 dark:hover:text-white transition-colors text-sm font-medium">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-[#e0e0e0] dark:border-zinc-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#999] dark:text-gray-500 font-medium">
          <div>(c) 2026 ITRHUB. All rights reserved.</div>
          <div>Secure document vault | Your data stays private</div>
          <div>ITR Filing Deadline: July 31, 2026</div>
        </div>
      </div>
    </footer>
  );
}
