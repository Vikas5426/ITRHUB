"use client";

import { motion } from "framer-motion";
import { Calendar, Download, AlertTriangle, Info, Clock } from "lucide-react";
import { useState, useEffect } from "react";

const SUN_DEADLINE = {
  id: "itr",
  name: "ITR Filing Deadline",
  date: "2026-07-31",
  displayDate: "July 31",
  penalty: "Late fee up to ₹5,000 under Sec 234F. No carry-forward of certain losses.",
};

const PLANETS = [
  {
    id: "adv1",
    name: "Advance Tax Q1 (15%)",
    date: "2026-06-15",
    displayDate: "June 15",
    penalty: "1% interest per month under Sec 234C.",
    color: "bg-blue-500",
    shadow: "shadow-blue-500/50",
    position: { top: "15%", left: "15%" },
    orbitSize: 300,
  },
  {
    id: "adv2",
    name: "Advance Tax Q2 (45%)",
    date: "2026-09-15",
    displayDate: "Sept 15",
    penalty: "1% interest per month under Sec 234C.",
    color: "bg-emerald-500",
    shadow: "shadow-emerald-500/50",
    position: { top: "10%", left: "75%" },
    orbitSize: 400,
  },
  {
    id: "adv3",
    name: "Advance Tax Q3 (75%)",
    date: "2026-12-15",
    displayDate: "Dec 15",
    penalty: "1% interest per month under Sec 234C.",
    color: "bg-amber-500",
    shadow: "shadow-amber-500/50",
    position: { top: "80%", left: "80%" },
    orbitSize: 450,
  },
  {
    id: "adv4",
    name: "Advance Tax Q4 (100%)",
    date: "2027-03-15",
    displayDate: "Mar 15",
    penalty: "1% interest per month under Sec 234B & 234C.",
    color: "bg-pink-500",
    shadow: "shadow-pink-500/50",
    position: { top: "50%", left: "8%" },
    orbitSize: 350,
  },
  {
    id: "audit",
    name: "Tax Audit Report",
    date: "2026-09-30",
    displayDate: "Sept 30",
    penalty: "0.5% of turnover or ₹1.5L max penalty.",
    color: "bg-purple-500",
    shadow: "shadow-purple-500/50",
    position: { top: "85%", left: "25%" },
    orbitSize: 500,
  },
];

export function TaxPulse() {
  const [daysLeft, setDaysLeft] = useState<number>(0);

  useEffect(() => {
    const updateDaysLeft = () => {
      const targetDate = new Date(SUN_DEADLINE.date).getTime();
      const now = new Date().getTime();
      const difference = targetDate - now;
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      setDaysLeft(days > 0 ? days : 0);
    };

    updateDaysLeft();
    const timer = window.setInterval(updateDaysLeft, 60 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const generateICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ITRHUB//Tax Pulse//EN\n";
    
    [SUN_DEADLINE, ...PLANETS].forEach((deadline) => {
      const dateStr = deadline.date.replace(/-/g, "");
      
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `UID:${deadline.id}@itrhub.com\n`;
      icsContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
      icsContent += `DTSTART;VALUE=DATE:${dateStr}\n`;
      icsContent += `SUMMARY:${deadline.name}\n`;
      icsContent += `DESCRIPTION:Deadline Reminder. Penalty for missing: ${deadline.penalty}\n`;
      icsContent += "BEGIN:VALARM\n";
      icsContent += "TRIGGER:-P7D\n";
      icsContent += "ACTION:DISPLAY\n";
      icsContent += `DESCRIPTION:Reminder: ${deadline.name} in 7 days!\n`;
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
    <section className="py-24 px-6 lg:px-12 relative z-10 bg-black/5 dark:bg-black/40 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-center">
        
        {/* Right Side / Text (Order 1 on mobile, 1 on desktop) */}
        <div className="lg:col-span-5 order-2 lg:order-1 relative z-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-6">
            <Clock size={14} />
            <span>Tax Pulse Tracker</span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-black mb-6 leading-tight text-black dark:text-white tracking-tight">
            Never pay a <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">late fee</span> again.
          </h2>
          
          <div className="relative pl-6 border-l-4 border-gray-200 dark:border-gray-800 mb-8">
            <p className="text-lg text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              Penalties can reach ₹5,000 overnight. Our tracker keeps you ahead of the curve with smart alerts for ITR, Advance Tax, and Audit deadlines tailored to your profile.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm mb-8">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">ITR Deadline in</span>
                <div className="text-4xl font-black text-black dark:text-white mt-1">
                  {daysLeft} <span className="text-xl font-bold text-gray-400">days</span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="text-primary w-8 h-8" />
              </div>
            </div>
          </div>

          <button 
            onClick={generateICS}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold shadow-lg hover:-translate-y-1 hover:shadow-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all"
          >
            <Download size={20} />
            Export to Calendar (.ics)
          </button>
          <p className="text-xs font-medium text-gray-500 mt-3 text-center sm:text-left">
            Includes smart reminders 7 days before each deadline.
          </p>
        </div>

        {/* Left Side / Solar System (Order 2 on mobile, 2 on desktop) */}
        <div className="lg:col-span-7 order-1 lg:order-2 h-[500px] lg:h-[600px] relative w-full flex items-center justify-center pointer-events-auto">
          
          {/* Subtle Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-radial from-primary/10 to-transparent opacity-50 blur-2xl" />

          {/* Orbit Rings (Decorative) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-gray-300 dark:border-gray-800 border-dashed opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-gray-300 dark:border-gray-800 border-dashed opacity-30" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-gray-300 dark:border-gray-800 border-dashed opacity-20" />

          {/* The Sun (ITR Deadline) */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center group cursor-help"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/40 blur-[30px] rounded-full" />
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-primary to-orange-500 border-2 border-white/20 shadow-[0_0_50px_rgba(var(--primary),0.6)] flex items-center justify-center relative z-10 transition-transform duration-300 group-hover:scale-110">
                <div className="text-center">
                  <span className="block text-2xl md:text-3xl font-black text-white">{SUN_DEADLINE.displayDate}</span>
                  <span className="block text-xs md:text-sm font-bold text-white/90 uppercase tracking-widest mt-1">ITR Filing</span>
                </div>
              </div>
            </div>
            
            {/* Sun Tooltip */}
            <div className="absolute top-full mt-4 w-64 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
               <div className="flex items-start gap-3">
                 <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                 <div>
                   <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Missing this deadline?</h4>
                   <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{SUN_DEADLINE.penalty}</p>
                 </div>
               </div>
            </div>
          </motion.div>

          {/* The Planets (Secondary Deadlines) */}
          {PLANETS.map((planet, index) => (
            <motion.div
              key={planet.id}
              initial={{ y: 0 }}
              animate={{ y: [-10, 10, -10] }}
              transition={{ 
                repeat: Infinity, 
                duration: 5 + index, 
                ease: "easeInOut",
                delay: index * 0.5 
              }}
              className="absolute z-10 flex flex-col items-center group cursor-help"
              style={planet.position}
            >
              <div className="relative">
                <div className={`absolute inset-0 ${planet.color} blur-[15px] rounded-full opacity-60`} />
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full ${planet.color} ${planet.shadow} border-2 border-white/20 shadow-lg flex items-center justify-center relative z-10 transition-transform duration-300 group-hover:scale-125`}>
                  <span className="text-xs md:text-sm font-black text-white text-center leading-tight px-1">{planet.displayDate}</span>
                </div>
              </div>

              <div className="mt-3 text-center bg-white/80 dark:bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md border border-gray-200 dark:border-gray-800">
                <span className="text-[10px] md:text-xs font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">{planet.name}</span>
              </div>
              
              {/* Planet Tooltip */}
              <div className="absolute top-full mt-2 w-56 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 origin-top transform scale-95 group-hover:scale-100">
                 <div className="flex items-start gap-3">
                   <Info className={`${planet.color.replace('bg-', 'text-')} shrink-0 mt-0.5`} size={18} />
                   <div>
                     <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Penalty Impact</h4>
                     <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{planet.penalty}</p>
                   </div>
                 </div>
              </div>
            </motion.div>
          ))}

        </div>

      </div>
    </section>
  );
}
