import { AppNavbar } from "@/components/AppNavbar";
import { ReturnPreparationWorkbench } from "@/components/return/ReturnPreparationWorkbench";
import { primaryNavLinks } from "@/lib/navigation";

export const metadata = {
  title: "Return Preparation Engine | ITRHUB",
  description: "Generate ITR schedules, validations, tax payable, challan guidance, and portal JSON.",
};

export default function PreparePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppNavbar links={primaryNavLinks} />
      <ReturnPreparationWorkbench />
    </div>
  );
}
