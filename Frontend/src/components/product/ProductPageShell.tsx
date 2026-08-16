import type { ReactNode } from "react";

import { AppNavbar } from "@/components/AppNavbar";
import { primaryNavLinks } from "@/lib/navigation";

type ProductPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  sideTitle: string;
  sideItems: string[];
  children: ReactNode;
};

export function ProductPageShell({
  eyebrow,
  title,
  description,
  sideTitle,
  sideItems,
  children,
}: ProductPageShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppNavbar links={primaryNavLinks} />
      <main className="mx-auto w-full max-w-7xl px-5 pb-20 pt-28 lg:px-8">
        <section className="mb-10 grid gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-6xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{description}</p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm font-black uppercase tracking-wider text-muted-foreground">{sideTitle}</p>
            <div className="mt-4 grid gap-2">
              {sideItems.map((item) => (
                <div key={item} className="rounded-2xl bg-muted/40 p-3 text-sm font-bold">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
        {children}
      </main>
    </div>
  );
}
