"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";

export function HeroSection() {
  const [timeLeft, setTimeLeft] = useState({
    days: 45,
    hours: 12,
    minutes: 30,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds--;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes--;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours--;
            } else {
              hours = 23;
              if (days > 0) {
                days--;
              }
            }
          }
        }
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative pt-32 pb-20 px-6 lg:px-12 flex flex-col items-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl z-10"
      >
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 text-black dark:text-white font-semibold text-sm bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20">
          <Clock size={16} />
          <span>Filing Deadline in:</span>
          <span className="font-mono font-bold text-primary">
            {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
          </span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 text-black dark:text-white leading-[0.9]">
          YOUR BANK <br />
          WON'T DO THIS
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 font-medium max-w-2xl mx-auto mb-12">
          India's most advanced platform that handles your ITR filing and manages your portfolios (stocks, debt, and real estate) seamlessly in one place.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-black dark:bg-primary text-white dark:text-black rounded-full font-bold text-lg shadow-lg dark:shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-xl transition-all flex items-center gap-2"
          >
            Start Filing Now <ArrowRight size={20} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-white dark:bg-transparent border border-gray-200 dark:border-white/20 rounded-full font-bold text-lg text-black dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 shadow-sm transition-all"
          >
            Connect Portfolio
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}
