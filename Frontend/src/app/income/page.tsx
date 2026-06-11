import { AppNavbar } from "@/components/AppNavbar";
import { IncomeSourceWizard } from "@/components/income/IncomeSourceWizard";
import { primaryNavLinks } from "@/lib/navigation";

export const metadata = {
  title: "Income Source Wizard | ITRHUB",
  description: "Capture all Indian ITR income sources and recommend the correct return form.",
};

export default function IncomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppNavbar links={primaryNavLinks} />
      <IncomeSourceWizard />
    </div>
  );
}
