import Link from "next/link";
import { ArrowRight, FileSearch, ShieldCheck, UploadCloud } from "lucide-react";

export function DocumentImportPreview() {
  return (
    <section className="px-6 py-20 lg:px-12">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-muted-foreground">Document import</p>
          <h2 className="text-4xl font-black tracking-tight text-black dark:text-white sm:text-5xl">
            Move filing documents into one reconciliation workspace.
          </h2>
          <p className="mt-4 max-w-xl text-lg font-medium text-gray-600 dark:text-gray-400">
            The full Form 16, AIS/TIS, 26AS, and checklist experience now lives on a dedicated page, so the home page stays focused.
          </p>
          <Link href="/documents" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/90">
            Open document workbench
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="minimal-card grid gap-4 p-6 sm:grid-cols-3">
          {[
            { icon: UploadCloud, title: "Upload", text: "Add Form 16, AIS/TIS, 26AS, CSV, JSON, or PDF files." },
            { icon: FileSearch, title: "Extract", text: "Find salary, TDS, interest, deductions, and gains." },
            { icon: ShieldCheck, title: "Reconcile", text: "Spot missing values before choosing the ITR form." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-background/70 p-4">
              <item.icon className="mb-4" size={24} />
              <h3 className="font-black">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
