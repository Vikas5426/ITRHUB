import { AppNavbar } from "@/components/AppNavbar";
import { WorkspaceDashboard } from "@/components/workspace/WorkspaceDashboard";
import { primaryNavLinks } from "@/lib/navigation";

export const metadata = {
  title: "Taxpayer Workspace | ITRHUB",
  description: "Manage taxpayer profiles, returns, progress, and tax documents.",
};

export default function WorkspacePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppNavbar links={primaryNavLinks} />
      <WorkspaceDashboard />
    </div>
  );
}
