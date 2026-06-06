"use client";

import { UserProfile } from "./data";
import { Clock } from "lucide-react";
import { useState, useEffect } from "react";

export function TrackerHeader({ profile, setProfile }: { profile: UserProfile, setProfile: (p: UserProfile) => void }) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const profiles: UserProfile[] = ["Salaried", "Freelancer", "Business"];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-gray-500 dark:text-gray-400">I am a →</span>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-full">
          {profiles.map((p) => (
            <button
              key={p}
              onClick={() => setProfile(p)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                profile === p
                  ? "bg-black text-white dark:bg-white dark:text-black shadow-md"
                  : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20 uppercase tracking-wider">
          FY 2025–26
        </div>
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-mono text-sm font-medium bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700">
          <Clock size={14} className="text-primary" />
          {currentTime ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "--:--:--"}
        </div>
      </div>
    </div>
  );
}
