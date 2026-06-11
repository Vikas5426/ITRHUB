import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Landmark, WalletCards } from "lucide-react";

export function IncomeWizardPreview() {
  return (
    <section className="px-6 py-20 lg:px-12 bg-gray-50 dark:bg-transparent">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="minimal-card grid gap-4 p-6 sm:grid-cols-3">
          {[
            { icon: BriefcaseBusiness, title: "Salary", text: "Multiple employers, Form 16, TDS, and standard deduction." },
            { icon: Landmark, title: "Business & gains", text: "Freelance, presumptive, STCG/LTCG, property, and crypto/VDA." },
            { icon: WalletCards, title: "Other sources", text: "Interest, dividends, foreign assets, agriculture, and exempt income." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-background/70 p-4">
              <item.icon className="mb-4" size={24} />
              <h3 className="font-black">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-muted-foreground">Income-source wizard</p>
          <h2 className="text-4xl font-black tracking-tight text-black dark:text-white sm:text-5xl">
            One flow for every source of income.
          </h2>
          <p className="mt-4 max-w-xl text-lg font-medium text-gray-600 dark:text-gray-400">
            The wizard replaces scattered ITR quizzes by capturing the actual income mix and saving the recommended ITR form to your filing workspace.
          </p>
          <Link href="/income" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/90">
            Start income wizard
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
