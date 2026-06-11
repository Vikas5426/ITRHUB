import { AppNavbar } from "@/components/AppNavbar";
import { DocumentsWorkbench } from "@/components/documents/DocumentsWorkbench";
import { FilingResources } from "@/components/FilingResources";
import { FilingSteps } from "@/components/FilingSteps";

export const metadata = {
  title: "Document Import & Reconciliation | ITRHUB",
  description: "Upload, parse, and reconcile Form 16, AIS, TIS, and Form 26AS.",
};

export default function DocumentsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppNavbar links={[{ href: "/", label: "Home" }, { href: "/workspace", label: "Workspace" }, { href: "/documents", label: "Documents" }, { href: "/portfolio", label: "Portfolio" }]} />
      <DocumentsWorkbench />
      <div className="border-t border-border bg-muted/20">
        <FilingSteps />
        <FilingResources />
      </div>
    </div>
  );
}
