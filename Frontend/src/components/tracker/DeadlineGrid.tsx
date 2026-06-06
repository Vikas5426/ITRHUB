"use client";

import { Deadline } from "./data";
import { useState } from "react";
import { CheckCircle, Bell, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function DeadlineGrid({ deadlines, onMarkDone, doneDeadlines }: { deadlines: Deadline[], onMarkDone: (id: string) => void, doneDeadlines: Set<string> }) {
  const [filter, setFilter] = useState<string>("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filters = ["All", "Advance Tax", "ITR", "Audit", "TDS"];

  const filteredDeadlines = deadlines.filter((d) => filter === "All" || d.type === filter);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Overdue": return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
      case "Due Soon": return "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
      case "Upcoming": return "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "Done": return "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
      default: return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200 dark:border-gray-800 h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-xl font-bold dark:text-white">All Deadlines</h3>
        
        <div className="flex flex-wrap gap-2">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                filter === f ? "bg-black text-white dark:bg-white dark:text-black" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDeadlines.map((deadline) => {
          const isExpanded = expanded === deadline.id;
          const isDone = doneDeadlines.has(deadline.id);

          return (
            <motion.div 
              layout
              key={deadline.id}
              className={`border rounded-2xl p-5 transition-all cursor-pointer ${isDone ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'}`}
              onClick={() => setExpanded(isExpanded ? null : deadline.id)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-xl font-black text-black dark:text-white mb-1">{deadline.displayDate}</div>
                  <div className={`text-sm font-bold ${isDone ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'}`}>{deadline.name}</div>
                </div>
                <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(deadline.status)}`}>
                  {deadline.status}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {deadline.applicableProfiles.map(p => (
                  <span key={p} className="text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                    {p}
                  </span>
                ))}
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800 mt-2 mb-4">
                      <p className="text-sm text-red-500 font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                        <span className="font-bold">Penalty:</span> {deadline.penalty}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2 mt-auto pt-2" onClick={e => e.stopPropagation()}>
                <button 
                  onClick={() => onMarkDone(deadline.id)}
                  className={`flex-1 flex justify-center items-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                    isDone 
                      ? "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700" 
                      : "bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                  }`}
                >
                  <CheckCircle size={14} />
                  {isDone ? "Completed" : "Mark as Done"}
                </button>
                <button className="flex-1 flex justify-center items-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Bell size={14} />
                  Set Reminder
                </button>
              </div>

              <div className="flex justify-center mt-3 text-gray-300 dark:text-gray-600">
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {filteredDeadlines.length === 0 && (
        <div className="text-center py-12 text-gray-400 font-medium">
          No deadlines found for this filter.
        </div>
      )}
    </div>
  );
}
