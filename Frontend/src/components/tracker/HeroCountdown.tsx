"use client";

import { Deadline } from "./data";
import { Download, CalendarDays, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function HeroCountdown({ deadline, allDeadlines }: { deadline: Deadline, allDeadlines: Deadline[] }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const target = new Date(deadline.date).getTime();
    
    const tick = () => {
      const now = new Date().getTime();
      const diff = target - now;
      
      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        return;
      }
      
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft({ d, h, m, s });
    };
    
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const generateICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ITRHUB//Tax Pulse//EN\n";
    
    allDeadlines.forEach((d) => {
      const dateStr = d.date.replace(/-/g, "");
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `UID:${d.id}@itrhub.com\n`;
      icsContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
      icsContent += `DTSTART;VALUE=DATE:${dateStr}\n`;
      icsContent += `SUMMARY:${d.name}\n`;
      icsContent += `DESCRIPTION:Deadline Reminder. Penalty for missing: ${d.penalty}\n`;
      icsContent += "BEGIN:VALARM\n";
      icsContent += "TRIGGER:-P7D\n";
      icsContent += "ACTION:DISPLAY\n";
      icsContent += `DESCRIPTION:Reminder: ${d.name} in 7 days!\n`;
      icsContent += "END:VALARM\n";
      icsContent += "END:VEVENT\n";
    });

    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ITRHUB_Tax_Deadlines.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#111111] text-white rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <CalendarDays size={200} />
      </div>
      
      <div className="relative z-10">
        <span className="text-gray-400 font-bold tracking-widest uppercase text-sm mb-4 block">Your Next Deadline</span>
        
        <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
          {deadline.name} — <span className="text-blue-400">{deadline.displayDate}</span>
        </h1>

        <div className="flex flex-wrap items-end gap-6 mb-8">
          <div className="flex gap-4 font-mono font-bold text-4xl md:text-5xl">
            <div className="flex flex-col items-center">
              <span>{timeLeft ? String(timeLeft.d).padStart(2, '0') : '--'}</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">Days</span>
            </div>
            <span className="text-gray-700">:</span>
            <div className="flex flex-col items-center">
              <span>{timeLeft ? String(timeLeft.h).padStart(2, '0') : '--'}</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">Hrs</span>
            </div>
            <span className="text-gray-700">:</span>
            <div className="flex flex-col items-center">
              <span>{timeLeft ? String(timeLeft.m).padStart(2, '0') : '--'}</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">Min</span>
            </div>
            <span className="text-gray-700 hidden sm:inline">:</span>
            <div className="flex flex-col items-center hidden sm:flex">
              <span className="w-12 text-center text-blue-400">
                {timeLeft ? String(timeLeft.s).padStart(2, '0') : '--'}
              </span>
              <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">Sec</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-red-400 bg-red-500/10 w-fit px-4 py-2 rounded-xl mb-10 border border-red-500/20">
          <AlertTriangle size={18} />
          <span className="font-medium text-sm md:text-base">Missing this means: {deadline.penalty}</span>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={generateICS}
          className="flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-colors"
        >
          <Download size={20} />
          Export to Calendar (.ics)
        </motion.button>
      </div>
    </div>
  );
}
