"use client";

import { Deadline } from "./data";
import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

export function HorizontalTimeline({ deadlines }: { deadlines: Deadline[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [todayPosition, setTodayPosition] = useState<number>(0);

  // Define full year months
  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Overdue": return "bg-red-500 text-white shadow-red-500/20";
      case "Due Soon": return "bg-amber-500 text-white shadow-amber-500/20";
      case "Upcoming": return "bg-emerald-500 text-white shadow-emerald-500/20";
      case "Done": return "bg-gray-200 text-gray-500 shadow-none dark:bg-gray-800 dark:text-gray-400";
      default: return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  // Helper to place deadline on timeline proportionally.
  // Assuming FY starts April 1, 2025 and ends March 31, 2026 for mapping logic.
  // Actually, let's just make it a relative percentage for visualization.
  const getTimelinePercentage = (dateStr: string) => {
    // simplified for visual representation
    const d = new Date(dateStr);
    let monthIndex = d.getMonth() - 3; // Apr is 0
    if (monthIndex < 0) monthIndex += 12;
    const day = d.getDate();
    return ((monthIndex * 30 + day) / 365) * 100;
  };

  useEffect(() => {
    // calculate today's position
    const now = new Date();
    let monthIndex = now.getMonth() - 3;
    if (monthIndex < 0) monthIndex += 12;
    const day = now.getDate();
    setTodayPosition(((monthIndex * 30 + day) / 365) * 100);
  }, []);

  return (
    <div className="relative w-full overflow-x-auto pb-4 pt-8 hide-scrollbar" ref={containerRef}>
      <div className="min-w-[1000px] relative h-72">
        
        {/* The Rail */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 dark:bg-gray-800 rounded-full -translate-y-1/2"></div>
        
        {/* Today Marker */}
        <div 
          className="absolute top-4 bottom-4 w-px bg-primary/40 z-0"
          style={{ left: `${Math.min(Math.max(todayPosition, 0), 100)}%` }}
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white dark:bg-white dark:text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Today</div>
          <div className="absolute top-0 bottom-0 w-full bg-primary/20 blur-[2px]"></div>
        </div>

        {/* Nodes */}
        {deadlines.map((deadline, index) => {
          const leftPos = getTimelinePercentage(deadline.date);
          const isTop = index % 2 === 0;

          return (
            <motion.div
              initial={{ opacity: 0, x: "-50%", y: isTop ? "-30%" : "-70%" }}
              animate={{ opacity: 1, x: "-50%", y: "-50%" }}
              transition={{ delay: index * 0.1 }}
              key={deadline.id}
              className="absolute top-1/2 z-10 w-3.5 h-3.5 group"
              style={{ left: `${leftPos}%` }}
            >
              {/* Rail Dot */}
              <div className={`w-full h-full rounded-full border-2 border-white dark:border-gray-900 relative z-20 ${getStatusColor(deadline.status).split(' ')[0]}`}></div>

              {/* Connector Line */}
              <div className={`absolute left-1/2 w-px bg-gray-200 dark:bg-gray-700 -translate-x-1/2 ${isTop ? 'bottom-full h-8' : 'top-full h-8'}`}></div>
              
              {/* Card */}
              <div className={`
                absolute left-1/2 -translate-x-1/2 w-48
                bg-white border border-gray-200 rounded-xl p-3 shadow-sm dark:bg-gray-900 dark:border-gray-800
                transition-all duration-300 group-hover:shadow-md
                ${isTop ? 'bottom-full mb-8 group-hover:-translate-y-1' : 'top-full mt-8 group-hover:translate-y-1'}
              `}>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-black dark:text-white">{deadline.displayDate}</span>
                  {deadline.percentage && (
                    <span className="text-[10px] font-bold bg-gray-100 px-1.5 rounded text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      {deadline.percentage}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300 font-medium leading-tight mb-2 line-clamp-2">
                  {deadline.name}
                </div>
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block shadow-sm ${getStatusColor(deadline.status)}`}>
                  {deadline.status}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Months axis */}
      <div className="min-w-[1000px] flex justify-between mt-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
        {months.map(m => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </div>
  );
}
