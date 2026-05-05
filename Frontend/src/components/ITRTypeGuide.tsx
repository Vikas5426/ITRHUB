"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCcw } from "lucide-react";

type Question = {
  id: string;
  text: string;
  desc?: string;
};

const questions: Question[] = [
  { id: 'salaried', text: "Are you a salaried employee?", desc: "You receive a Form 16 from your employer." },
  { id: 'capitalGains', text: "Do you have capital gains?", desc: "E.g., from selling stocks, mutual funds, or property." },
  { id: 'business', text: "Do you run a business or profession?", desc: "Including freelancing, trading, or consulting." },
  { id: 'multipleHouses', text: "Do you own more than one house property?", desc: "Generating rental income from multiple properties." }
];

export function ITRTypeGuide() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [direction, setDirection] = useState<1 | -1>(1);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (answer: boolean) => {
    const currentQ = questions[currentIndex];
    const newAnswers = { ...answers, [currentQ.id]: answer };
    setAnswers(newAnswers);
    setDirection(1);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowResult(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setAnswers({});
    setShowResult(false);
  };

  const getResult = () => {
    if (answers.business) {
      if (answers.capitalGains) return { form: 'ITR-3', reason: "Since you have business income AND capital gains, ITR-3 is the correct comprehensive form." };
      return { form: 'ITR-4', reason: "Ideal for freelancers and small businesses under the presumptive taxation scheme (Section 44AD/ADA)." };
    }
    if (answers.capitalGains || answers.multipleHouses) {
      return { form: 'ITR-2', reason: "Since you have capital gains or multiple house properties without business income, ITR-2 is required." };
    }
    if (answers.salaried) {
      return { form: 'ITR-1', reason: "The simplest form, perfect for salaried individuals with straightforward financial structures." };
    }
    return { form: 'ITR-1', reason: "Defaulting to ITR-1 for basic income structures. Consult a professional if you have complex assets." };
  };

  return (
    <div className="relative w-full h-[280px] flex items-center justify-center perspective-[1000px] mb-8">
      <AnimatePresence mode="popLayout" custom={direction}>
        {!showResult ? (
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, y: direction > 0 ? 50 : -50, scale: 0.9, rotateX: direction > 0 ? -10 : 10 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ 
              opacity: 0, 
              y: direction > 0 ? -100 : 100, // anti-gravity fly off upwards
              scale: 1.05, 
              rotateZ: direction > 0 ? 5 : 0 
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute w-full max-w-sm z-10"
          >
            <div className="p-6 rounded-2xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 shadow-xl backdrop-blur-md relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="text-xs font-bold text-primary">Question {currentIndex + 1} of {questions.length}</div>
                    <div className="flex gap-1">
                        {questions.map((_, idx) => (
                            <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? 'w-4 bg-primary' : idx < currentIndex ? 'w-1.5 bg-primary/50' : 'w-1.5 bg-gray-200 dark:bg-white/20'}`} />
                        ))}
                    </div>
                </div>
                <h4 className="text-xl font-bold text-black dark:text-white mb-2 leading-tight">{questions[currentIndex].text}</h4>
                <p className="text-sm text-gray-500 dark:text-muted-foreground mb-8 min-h-[40px]">{questions[currentIndex].desc}</p>
                
                <div className="flex gap-4 mt-auto">
                  <button 
                    onClick={() => handleAnswer(false)}
                    className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-white/10 text-black dark:text-foreground font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  >
                    No
                  </button>
                  <button 
                    onClick={() => handleAnswer(true)}
                    className="flex-1 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)", y: 20 }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.8, delay: 0.1 }}
            className="absolute w-full max-w-sm z-20"
          >
            <div className="p-8 rounded-3xl bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-gray-200 dark:border-white/20 shadow-2xl relative overflow-hidden">
              {/* Glassmorphic shiny reflection */}
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/60 to-transparent dark:from-white/10 pointer-events-none rounded-t-3xl" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <p className="text-sm font-bold text-primary mb-2 uppercase tracking-wider">Your Ideal Form</p>
                <motion.h3 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring", bounce: 0.6 }}
                  className="text-6xl font-black text-black dark:text-white mb-4 tracking-tighter drop-shadow-sm"
                >
                  {getResult().form}
                </motion.h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-8 leading-relaxed">
                  {getResult().reason}
                </p>
                
                <button 
                  onClick={handleRestart}
                  className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors bg-gray-100 dark:bg-white/5 py-2 px-4 rounded-full hover:bg-gray-200 dark:hover:bg-white/10"
                >
                  <RefreshCcw size={16} /> Start Over
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
