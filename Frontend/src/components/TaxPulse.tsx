"use client";

import { motion } from "framer-motion";
import { Calendar, Download, AlertTriangle, Info, Clock, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

const SUN_DEADLINE = {
  id: "itr",
  name: "ITR Filing Deadline",
  date: "2026-07-31",
  displayDate: "July 31",
  penalty: "Late fee up to Rs 5,000 under Sec 234F. No carry-forward of certain losses.",
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
    penalty: "0.5% of turnover or Rs 1.5L max penalty.",
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
    link.setAttribute("download", "ITRHUB_Tax_Deadlines_AY2026-27.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="py-24 px-6 lg:px-12 relative z-10 bg-muted/20 border-y border-border/40 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-center">
        
        {/* Text Info */}
        <div className="lg:col-span-5 order-2 lg:order-1 relative z-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider mb-6 shadow-xs">
            <Clock size={14} />
            <span>Tax Pulse Radar</span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-black mb-6 leading-tight text-foreground tracking-tight">
            Never pay a <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">late fee</span> again.
          </h2>
          
          <div className="relative pl-6 border-l-4 border-primary/30 mb-8">
            <p className="text-base text-muted-foreground font-medium leading-relaxed">
              Statutory deadlines under Section 139(1) for ITR, Advance Tax installments, and Tax Audits carry strict penalties and interest under Section 234A/B/C/F. Stay ahead with live orbital tracking.
            </p>
          </div>

          <div className="bg-card rounded-3xl border border-border p-6 shadow-xs mb-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">ITR-1/2 Deadline in</span>
                <div className="text-4xl font-black text-foreground mt-1">
                  {daysLeft} <span className="text-xl font-bold text-muted-foreground">days</span>
                </div>
              </div>
              <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Calendar className="size-7" />
              </div>
            </div>
          </div>

          <button 
            onClick={generateICS}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-black shadow-lg hover:bg-primary/90 hover:-translate-y-0.5 transition-all"
          >
            <Download size={18} />
            <span>Export to Calendar (.ics)</span>
          </button>
          <p className="text-xs font-bold text-muted-foreground mt-3 text-center sm:text-left">
            Includes auto-reminders 7 days before each deadline.
          </p>
        </div>

        {/* Solar System Radar */}
        <div className="lg:col-span-7 order-1 lg:order-2 h-[480px] lg:h-[580px] relative w-full flex items-center justify-center pointer-events-auto">
          
          {/* Subtle Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-radial from-amber-500/10 to-transparent opacity-60 blur-3xl pointer-events-none" />

          {/* Orbit Rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full border border-border/80 border-dashed opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full border border-border/60 border-dashed opacity-40" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full border border-border/40 border-dashed opacity-30" />

          {/* The Sun (ITR Deadline) */}
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center group cursor-pointer"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/30 blur-[25px] rounded-full" />
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 border-2 border-white/40 shadow-[0_0_40px_rgba(245,158,11,0.5)] flex items-center justify-center relative z-10 transition-transform duration-300 group-hover:scale-105">
                <div className="text-center text-white">
                  <span className="block text-2xl md:text-3xl font-black">{SUN_DEADLINE.displayDate}</span>
                  <span className="block text-[10px] md:text-xs font-black uppercase tracking-widest mt-1 opacity-90">ITR Filing</span>
                </div>
              </div>
            </div>
            
            {/* Sun Tooltip */}
            <div className="absolute top-full mt-3 w-64 p-4 bg-card/95 backdrop-blur-xl rounded-2xl border border-border shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
               <div className="flex items-start gap-3">
                 <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
                 <div>
                   <h4 className="font-black text-foreground text-xs mb-1">July 31 Statutory Due Date</h4>
                   <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">{SUN_DEADLINE.penalty}</p>
                 </div>
               </div>
            </div>
          </motion.div>

          {/* The Planets (Secondary Deadlines) */}
          {PLANETS.map((planet, index) => (
            <motion.div
              key={planet.id}
              initial={{ y: 0 }}
              animate={{ y: [-8, 8, -8] }}
              transition={{ 
                repeat: Infinity, 
                duration: 4.5 + index, 
                ease: "easeInOut",
                delay: index * 0.4 
              }}
              className="absolute z-10 flex flex-col items-center group cursor-pointer"
              style={planet.position}
            >
              <div className="relative">
                <div className={`absolute inset-0 ${planet.color} blur-[12px] rounded-full opacity-50`} />
                <div className={`w-11 h-11 md:w-14 md:h-14 rounded-full ${planet.color} ${planet.shadow} border-2 border-white/30 shadow-md flex items-center justify-center relative z-10 transition-transform duration-300 group-hover:scale-120`}>
                  <span className="text-[11px] md:text-xs font-black text-white text-center leading-tight px-1">{planet.displayDate}</span>
                </div>
              </div>

              <div className="mt-2 text-center bg-card/90 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-border shadow-xs">
                <span className="text-[10px] md:text-[11px] font-black text-foreground whitespace-nowrap">{planet.name}</span>
              </div>
              
              {/* Planet Tooltip */}
              <div className="absolute top-full mt-2 w-56 p-3.5 bg-card/95 backdrop-blur-xl rounded-2xl border border-border shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 origin-top transform scale-95 group-hover:scale-100">
                 <div className="flex items-start gap-2.5">
                   <Info className={`${planet.color.replace('bg-', 'text-')} shrink-0 mt-0.5`} size={16} />
                   <div>
                     <h4 className="font-black text-foreground text-xs mb-1">Statutory Impact</h4>
                     <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">{planet.penalty}</p>
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

