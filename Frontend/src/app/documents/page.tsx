import { AppNavbar } from "@/components/AppNavbar";
import { DocumentsWorkbench } from "@/components/documents/DocumentsWorkbench";
import { primaryNavLinks } from "@/lib/navigation";

export const metadata = {
  title: "Document Import & Reconciliation | ITRHUB",
  description: "Upload, parse, and reconcile Form 16, AIS, TIS, and Form 26AS.",
};

export default function DocumentsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppNavbar links={primaryNavLinks} />
      <DocumentsWorkbench />
    </div>
  );
}
