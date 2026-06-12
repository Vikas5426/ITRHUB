import Link from "next/link";
import { Hexagon } from "lucide-react";

import { footerCompanyLinks, footerResourceLinks } from "@/lib/navigation";

const TwitterIcon = ({ size = 24 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const LinkedinIcon = ({ size = 24 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

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
            <div className="flex items-center gap-4 mt-2">
              <Link href="/" aria-label="Twitter" className="text-[#666] hover:text-[#0f0f0f] dark:text-gray-400 dark:hover:text-white transition-colors">
                <TwitterIcon size={20} />
              </Link>
              <Link href="/" aria-label="LinkedIn" className="text-[#666] hover:text-[#0f0f0f] dark:text-gray-400 dark:hover:text-white transition-colors">
                <LinkedinIcon size={20} />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-black dark:text-white mb-6">Resources</h3>
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
            <h3 className="font-bold text-black dark:text-white mb-6">Company</h3>
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
