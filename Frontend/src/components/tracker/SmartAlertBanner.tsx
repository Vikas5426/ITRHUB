"use client";

import { UserProfile, Deadline } from "./data";
import { Sparkles } from "lucide-react";

export function SmartAlertBanner({ profile, nextDeadline }: { profile: UserProfile, nextDeadline?: Deadline }) {
  if (!nextDeadline) return null;

  // Mock personalized nudges based on profile
  let nudgeText = "";
  if (profile === "Salaried") {
    nudgeText = `Based on your Form 16 estimate, your ${nextDeadline.name} is due soon. Have you collected your 80C proofs?`;
  } else if (profile === "Freelancer") {
    nudgeText = `Based on your FY24 receipts, your ${nextDeadline.name} is approaching. Make sure to claim your 44ADA deductions.`;
  } else if (profile === "Business") {
    nudgeText = `Based on your connected GST returns, your ${nextDeadline.name} is due in a few weeks. Have your books ready.`;
  }

  // Choose tint color based on urgency
  const getTint = (status?: string) => {
    switch (status) {
      case "Overdue": return "bg-red-50 border-red-200 text-red-900 border-l-red-500";
      case "Due Soon": return "bg-amber-50 border-amber-200 text-amber-900 border-l-amber-500";
      default: return "bg-blue-50 border-blue-200 text-blue-900 border-l-blue-500";
    }
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border border-l-4 shadow-sm ${getTint(nextDeadline.status)}`}>
      <Sparkles className="shrink-0 mt-0.5 opacity-70" size={20} />
      <div>
        <p className="font-medium text-sm leading-relaxed">
          {nudgeText}
        </p>
      </div>
    </div>
  );
}
