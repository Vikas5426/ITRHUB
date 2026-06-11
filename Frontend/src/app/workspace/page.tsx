import { AppNavbar } from "@/components/AppNavbar";
import { WorkspaceDashboard } from "@/components/workspace/WorkspaceDashboard";

export const metadata = {
  title: "Taxpayer Workspace | ITRHUB",
  description: "Manage taxpayer profiles, returns, progress, and tax documents.",
};

export default function WorkspacePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppNavbar links={[{ href: "/", label: "Home" }, { href: "/workspace", label: "Workspace" }, { href: "/documents", label: "Documents" }, { href: "/portfolio", label: "Portfolio" }]} />
      <WorkspaceDashboard />
    </div>
  );
}
