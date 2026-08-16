import Link from "next/link";
import { Hexagon, LockKeyhole, ShieldCheck } from "lucide-react";

import { footerCompanyLinks, footerResourceLinks } from "@/lib/navigation";

export function Footer() {
  return (
    <footer className="bg-card/70 border-t border-border pt-16 pb-10">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Hexagon className="text-primary" fill="currentColor" size={26} />
              <span className="text-xl font-black tracking-tight text-foreground uppercase">ITRHUB</span>
            </div>
            <p className="font-black text-foreground text-base">Everything you need to file Indian Taxes.</p>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-sm">
              Statutory guidance, multi-source income capture, loss harvesting, and offline JSON generation. All in one place.
            </p>
            <div className="mt-2 grid gap-2 text-xs font-bold text-muted-foreground">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 shadow-xs">
                <ShieldCheck size={14} className="text-primary" />
                <span>AY 2026-27 Compliant (ITR-1 to 4)</span>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 shadow-xs">
                <LockKeyhole size={14} className="text-primary" />
                <span>Client-Side Encryption & Privacy First</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-black text-foreground text-sm uppercase tracking-wider mb-5">Filing Journey</h3>
            <ul className="flex flex-col gap-2.5">
              {footerResourceLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-xs font-bold">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-black text-foreground text-sm uppercase tracking-wider mb-5">Smart Tax Tools</h3>
            <ul className="flex flex-col gap-2.5">
              {footerCompanyLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-xs font-bold">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border/60 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-bold">
          <div>© 2026 ITRHUB. All rights reserved.</div>
          <div>Secure Document Vault • Offline JSON Schema Validation</div>
          <div>ITR Due Date: July 31, 2026</div>
        </div>
      </div>
    </footer>
  );
}
