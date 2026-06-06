"use client";

import { useState } from "react";
import { UserProfile, DEADLINES_DATA, computeStatus } from "./data";
import { TrackerHeader } from "./TrackerHeader";
import { HeroCountdown } from "./HeroCountdown";
import { HorizontalTimeline } from "./HorizontalTimeline";
import { DeadlineGrid } from "./DeadlineGrid";
import { PenaltyCalculator } from "./PenaltyCalculator";
import { SmartAlertBanner } from "./SmartAlertBanner";

export function TaxPulseTracker() {
  const [profile, setProfile] = useState<UserProfile>("Salaried");
  const [doneDeadlines, setDoneDeadlines] = useState<Set<string>>(new Set());

  // Filter deadlines based on profile
  const activeDeadlines = DEADLINES_DATA.filter((d) =>
    d.applicableProfiles.includes(profile)
  ).map((d) => ({
    ...d,
    status: computeStatus(d.date, doneDeadlines.has(d.id)),
  }));

  // Sort by soonest (ignoring Done and Overdue for the hero, or just picking the first upcoming/due soon)
  const sortedDeadlines = [...activeDeadlines].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const nextUrgentDeadline = sortedDeadlines.find(
    (d) => d.status === "Upcoming" || d.status === "Due Soon" || d.status === "Overdue"
  ) || sortedDeadlines[0];

  const handleMarkDone = (id: string) => {
    setDoneDeadlines((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#F2F2F2] text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <TrackerHeader profile={profile} setProfile={setProfile} />
        
        {/* Profile-aware nudge */}
        <SmartAlertBanner profile={profile} nextDeadline={nextUrgentDeadline} />

        {nextUrgentDeadline && (
          <HeroCountdown deadline={nextUrgentDeadline} allDeadlines={activeDeadlines} />
        )}

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold mb-6">FY 2025–26 Timeline</h3>
          <HorizontalTimeline deadlines={sortedDeadlines} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <DeadlineGrid deadlines={sortedDeadlines} onMarkDone={handleMarkDone} doneDeadlines={doneDeadlines} />
          </div>
          <div className="lg:col-span-1">
            <PenaltyCalculator />
          </div>
        </div>
      </div>
    </div>
  );
}
