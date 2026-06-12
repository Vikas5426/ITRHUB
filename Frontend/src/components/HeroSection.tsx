"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev;

        if (seconds > 0) {
          seconds -= 1;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes -= 1;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours -= 1;
            } else {
              hours = 23;
              if (days > 0) {
                days -= 1;
              }
            }
          }
        }

        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section
      className="relative flex flex-col items-center px-6 pb-20 pt-32 text-center lg:px-12"
      suppressHydrationWarning
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 max-w-4xl"
        suppressHydrationWarning
      >
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-100 px-5 py-2 text-sm font-semibold text-black dark:border-white/20 dark:bg-white/10 dark:text-white">
          <Clock size={16} />
          <span>Filing deadline in</span>
          <span className="font-mono font-bold text-primary">
            {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
          </span>
        </div>

        <h1 className="mb-8 text-6xl font-black leading-[0.9] tracking-tighter text-black dark:text-white md:text-8xl">
          FILE SMARTER.
          <br />
          SEE EVERYTHING.
        </h1>

        <p className="mx-auto mb-12 max-w-2xl text-lg font-medium text-gray-600 dark:text-gray-400 md:text-xl">
          A guided ITR workspace for salary, business, capital gains, foreign assets, documents, and deadlines. Start with the right flow, then let the platform keep everything connected.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/workspace"
              className="flex items-center gap-2 rounded-full bg-black px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl dark:bg-primary dark:text-black dark:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
            >
              Start filing now <ArrowRight size={20} />
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/income"
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-8 py-4 text-lg font-bold text-black shadow-sm transition-all hover:bg-gray-50 dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
            >
              Map income sources
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/documents"
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-8 py-4 text-lg font-bold text-black shadow-sm transition-all hover:bg-gray-50 dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
            >
              Import documents
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
