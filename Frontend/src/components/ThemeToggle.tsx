"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{
          y: isDark ? -30 : 0,
          opacity: isDark ? 0 : 1,
        }}
        transition={{ duration: 0.3, type: "spring", stiffness: 200, damping: 20 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <Sun size={20} />
      </motion.div>
      <motion.div
        initial={false}
        animate={{
          y: isDark ? 0 : 30,
          opacity: isDark ? 1 : 0,
        }}
        transition={{ duration: 0.3, type: "spring", stiffness: 200, damping: 20 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <Moon size={20} />
      </motion.div>
    </motion.button>
  );
}
