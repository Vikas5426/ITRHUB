import { AppNavbar } from "@/components/AppNavbar";
import { ProfileCommandCenter } from "@/components/profile/ProfileCommandCenter";
import { primaryNavLinks } from "@/lib/navigation";

export const metadata = {
  title: "Taxpayer Profile & Identity | ITRHUB",
  description: "Manage your canonical personal identity, statutory PAN, tax residency, and account security.",
};

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative selection:bg-primary/10 selection:text-primary">
      <AppNavbar links={primaryNavLinks} />

      <main className="relative pt-20 pb-24">
        <ProfileCommandCenter />
      </main>
    </div>
  );
}
