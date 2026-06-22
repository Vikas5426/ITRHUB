"use client";

import { useState, useEffect, useRef } from "react";
import type { ComponentType } from "react";
import { motion, AnimatePresence, useScroll, useSpring, useTransform, type PanInfo, type Variants } from "framer-motion";
import { 
  FileText, 
  FileSpreadsheet, 
  Building, 
  FileDigit, 
  Bot, 
  CheckCircle2, 
  GripVertical,
  ExternalLink,
  Loader2,
  CheckCircle,
  Info,
  X,
  Copy,
  ArrowRight,
  ArrowLeft,
  RotateCcw
} from "lucide-react";

// --- Data Models ---
type StepData = {
  id: string;
  title: string;
  description: string;
  botTip: string;
};

const DEFAULT_FILING_STEPS: StepData[] = [
  {
    id: "step-1",
    title: "Gather Documents",
    description: "Collect your Form 16, salary slips, and investment proofs.",
    botTip: "Start with your Form 16. It has your salary details and TDS already calculated!",
  },
  {
    id: "step-2",
    title: "Verify AIS/26AS",
    description: "Cross-check your high-value transactions and TDS deducted.",
    botTip: "Don't forget to check your TIS (Taxpayer Information Summary) for recent high-value transactions or stock sales.",
  },
  {
    id: "step-3",
    title: "Claim Deductions",
    description: "Ensure all 80C, 80D, and HRA deductions are accounted for.",
    botTip: "Did you pay rent? Make sure to keep your landlord's PAN handy if rent exceeds Rs 1 Lakh/year.",
  },
  {
    id: "step-4",
    title: "File ITR",
    description: "Review your final tax liability and submit the return.",
    botTip: "Almost there! I'll auto-select the right ITR form for you based on the documents you provided.",
  },
];

type DocumentStatus = "pending" | "scanning" | "ready";

type DocumentType = {
  id: string;
  name: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  status: DocumentStatus;
  stepId: string;
  externalLink?: string;
  summary: string;
  why: string;
  passwordHint?: string;
};

const MASTER_DOCS: DocumentType[] = [
  { 
    id: "doc-1", 
    name: "Form 16 (Part A & B)", 
    icon: FileText, 
    status: "pending", 
    stepId: "step-1",
    summary: "Form 16 is a certificate issued by your employer validating that TDS has been deducted from your salary.",
    why: "It is mandatory for salaried employees to file their tax return as it contains the precise breakdown of your salary and tax deducted.",
  },
  { 
    id: "doc-2", 
    name: "Rent Receipts", 
    icon: Building, 
    status: "pending", 
    stepId: "step-3",
    summary: "Rent receipts are documented proof of the rent you paid for your accommodation during the financial year.",
    why: "Required to claim House Rent Allowance (HRA) exemption. Needs landlord signature, and their PAN if total rent > Rs 1,00,000.",
  },
  { 
    id: "doc-3", 
    name: "AIS / TIS", 
    icon: FileSpreadsheet, 
    status: "pending", 
    stepId: "step-2",
    externalLink: "https://eportal.incometax.gov.in/",
    summary: "Annual Information Statement (AIS) and Taxpayer Information Summary (TIS) provide a high-definition report of all your financial transactions.",
    why: "Ensures no income is forgotten or mismatched with the Income Tax Department's records, preventing future notices.",
    passwordHint: "PAN (lowercase) + Date of Birth (DDMMYYYY)"
  },
  { 
    id: "doc-4", 
    name: "Form 26AS", 
    icon: FileDigit, 
    status: "pending", 
    stepId: "step-2",
    externalLink: "https://eportal.incometax.gov.in/",
    summary: "Form 26AS is your consolidated annual tax statement from the government.",
    why: "It acts as the legal record of all tax credits, TDS, and TCS deposited against your PAN.",
    passwordHint: "Date of Birth (DDMMYYYY)"
  },
  {
    id: "doc-5",
    name: "Form 16A",
    icon: FileText,
    status: "pending",
    stepId: "step-1",
    summary: "Form 16A is a TDS certificate issued for income other than salary.",
    why: "Required for freelancers/contractors to claim tax credits on TDS deducted by clients."
  },
  {
    id: "doc-6",
    name: "Bank Statements",
    icon: Building,
    status: "pending",
    stepId: "step-1",
    summary: "Your official bank account statements for the financial year.",
    why: "Crucial for calculating professional income, tracking business expenses, and reporting interest income."
  },
  {
    id: "doc-7",
    name: "Capital Gains Statement",
    icon: FileSpreadsheet,
    status: "pending",
    stepId: "step-1",
    summary: "A consolidated statement of all your mutual fund and stock market transactions (CAMS/CAS/Broker Reports).",
    why: "Needed to accurately calculate short-term and long-term capital gains tax liability."
  }
];

const QUESTIONS = [
  {
    id: 'q1',
    text: "What is your primary income source?",
    options: ["Salaried", "Freelancer/Business", "Other/Retired"]
  },
  {
    id: 'q2',
    text: "Do you pay rent for your current accommodation?",
    options: ["Yes", "No"]
  },
  {
    id: 'q3',
    text: "Did you sell any stocks, mutual funds, or crypto this year?",
    options: ["Yes", "No"]
  }
];

// Variants for questionnaire transitions
const questionVariants: Variants = {
  enter: (direction: number) => ({
    y: direction > 0 ? 50 : -50,
    opacity: 0
  }),
  center: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: "easeOut" }
  },
  exit: (direction: number) => ({
    y: direction > 0 ? -50 : 50,
    opacity: 0,
    transition: { duration: 0.3, ease: "easeIn" }
  })
};

const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const listItemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function FilingSteps() {
  const [filingSteps, setFilingSteps] = useState<StepData[]>(DEFAULT_FILING_STEPS);
  const [activeStepId, setActiveStepId] = useState<string>(DEFAULT_FILING_STEPS[0].id);
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [selectedInfoDoc, setSelectedInfoDoc] = useState<DocumentType | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "info" | "error"; message: string } | null>(null);

  // Pre-Flight Checklist State
  const [hasCompletedPreFlight, setHasCompletedPreFlight] = useState(false);
  const [questionStep, setQuestionStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 for forwards, -1 for backwards
  const [isGenerating, setIsGenerating] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({
    q1: "",
    q2: "",
    q3: ""
  });

  // Scroll Timeline Logic
  const timelineRef = useRef<HTMLDivElement>(null);
  const readyZoneRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start center", "end center"],
  });
  
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const readyZoneScale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);

  // Intersection Observer for Active Step
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveStepId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0.1 }
    );

    stepRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [filingSteps]); // Re-run when filingSteps changes

  const activeStepData = filingSteps.find((s) => s.id === activeStepId) || filingSteps[0];

  // Logic Engine
  const generatePersonalizedData = (finalAnswers: Record<string, string>) => {
    // 1. Generate Documents
    const docs: DocumentType[] = [];
    docs.push(MASTER_DOCS.find(d => d.id === "doc-3")!); // AIS
    docs.push(MASTER_DOCS.find(d => d.id === "doc-4")!); // 26AS

    if (finalAnswers.q1 === "Salaried") {
      docs.unshift(MASTER_DOCS.find(d => d.id === "doc-1")!); // Form 16
    }
    if (finalAnswers.q1 === "Freelancer/Business") {
      docs.unshift(MASTER_DOCS.find(d => d.id === "doc-6")!); // Bank Statements
      docs.unshift(MASTER_DOCS.find(d => d.id === "doc-5")!); // 16A
    }
    if (finalAnswers.q2 === "Yes") {
      docs.push(MASTER_DOCS.find(d => d.id === "doc-2")!); // Rent Receipts
    }
    if (finalAnswers.q3 === "Yes") {
      docs.push(MASTER_DOCS.find(d => d.id === "doc-7")!); // Capital Gains
    }

    setDocuments(docs);

    // Step generation is now handled live by updateStepsLive, but we can call it here just to be sure
    updateStepsLive(finalAnswers);
    setActiveStepId("step-1");
  };

  // Live Step Updater
  const updateStepsLive = (currentAnswers: Record<string, string>) => {
    const steps: StepData[] = [
      {
        id: "step-1",
        title: "Gather Documents",
        description: "Collect your mandatory documents and proofs.",
        botTip: "Start gathering everything listed in your personalized checklist.",
      },
      {
        id: "step-2",
        title: "Verify AIS/26AS",
        description: "Cross-check your high-value transactions and TDS deducted.",
        botTip: "Don't forget to check your TIS (Taxpayer Information Summary) for recent high-value transactions or stock sales.",
      }
    ];

    if (currentAnswers.q1 === "Freelancer/Business") {
      steps.push({
        id: "step-biz",
        title: "Declare Business Income",
        description: "Calculate your professional receipts and business expenses.",
        botTip: "As a freelancer, you might be eligible for presumptive taxation under section 44ADA. We'll check that!"
      });
    }

    if (currentAnswers.q3 === "Yes") {
      steps.push({
        id: "step-cg",
        title: "Calculate Capital Gains",
        description: "Import your broker reports to calculate short/long-term gains.",
        botTip: "Capital gains can be tricky. Make sure to download the exact Tax P&L report from your broker."
      });
    }

    steps.push({
      id: "step-3",
      title: "Claim Deductions",
      description: "Ensure all 80C, 80D, and HRA deductions are accounted for.",
      botTip: currentAnswers.q2 === "Yes" 
        ? "Did you pay rent? Make sure to keep your landlord's PAN handy if rent exceeds Rs 1 Lakh/year."
        : "Don't miss out on 80C investments like ELSS or PPF to maximize your refund.",
    });

    steps.push({
      id: "step-4",
      title: "File ITR",
      description: "Review your final tax liability and submit the return.",
      botTip: "Almost there! I'll auto-select the right ITR form for you based on the documents and income sources provided.",
    });

    setFilingSteps(steps);
  };

  const handleAnswer = (option: string) => {
    setDirection(1);
    const currentQ = QUESTIONS[questionStep];
    const newAnswers = { ...answers, [currentQ.id]: option };
    setAnswers(newAnswers);
    
    // Update the timeline steps immediately so the user sees real-time changes
    updateStepsLive(newAnswers);

    if (questionStep < QUESTIONS.length - 1) {
      setQuestionStep(prev => prev + 1);
    } else {
      // Finished all questions
      setIsGenerating(true);
      setTimeout(() => {
        generatePersonalizedData(newAnswers);
        setIsGenerating(false);
        setHasCompletedPreFlight(true);
      }, 1500);
    }
  };

  const handleBack = () => {
    if (questionStep > 0) {
      setDirection(-1);
      setQuestionStep(prev => prev - 1);
    }
  };

  const handleStartOver = () => {
    setHasCompletedPreFlight(false);
    setQuestionStep(0);
    setDirection(-1);
    setAnswers({ q1: "", q2: "", q3: "" });
    setDocuments([]);
    setFilingSteps(DEFAULT_FILING_STEPS);
  };

  // Framer Motion Drag and Drop Logic
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, docId: string) => {
    if (!readyZoneRef.current) return;

    const readyZoneRect = readyZoneRef.current.getBoundingClientRect();
    const draggedElement = document.getElementById(`drag-${docId}`);
    
    if (!draggedElement) return;

    const draggedRect = draggedElement.getBoundingClientRect();
    
    // Calculate the physical center of the dragged card
    const draggedCenterX = draggedRect.left + draggedRect.width / 2;
    const draggedCenterY = draggedRect.top + draggedRect.height / 2;

    const BUFFER = 50; // generous hit box
    
    const isInsideReadyZone = 
      draggedCenterX >= readyZoneRect.left - BUFFER &&
      draggedCenterX <= readyZoneRect.right + BUFFER &&
      draggedCenterY >= readyZoneRect.top - BUFFER &&
      draggedCenterY <= readyZoneRect.bottom + BUFFER;

    if (isInsideReadyZone) {
      setDocuments((prev) =>
        prev.map((doc) => doc.id === docId ? { ...doc, status: "scanning" } : doc)
      );

      setTimeout(() => {
        setDocuments((prev) =>
          prev.map((doc) => doc.id === docId ? { ...doc, status: "ready" } : doc)
        );
      }, 1500);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice({ type: "success", message: "Example PAN copied to clipboard." });
    } catch (err) {
      console.error("Failed to copy", err);
      setNotice({ type: "error", message: "Could not copy the PAN example. Please copy it manually." });
    }
  };

  // Derived State
  const pendingDocs = documents.filter((d) => d.status === "pending");
  const scanningDocs = documents.filter((d) => d.status === "scanning");
  const readyDocs = documents.filter((d) => d.status === "ready");
  
  const completionPercentage = documents.length > 0 ? Math.round((readyDocs.length / documents.length) * 100) : 0;
  const isAllComplete = documents.length > 0 && completionPercentage === 100;

  const isStepComplete = (stepId: string) => {
    if (!hasCompletedPreFlight) return false;
    const stepDocs = documents.filter((d) => d.stepId === stepId);
    if (stepDocs.length === 0) return isAllComplete; 
    return stepDocs.every((d) => d.status === "ready");
  };

  return (
    <>
      {/* Glassmorphic Info Modal */}
      <AnimatePresence>
        {selectedInfoDoc && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setSelectedInfoDoc(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedInfoDoc(null)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                  <selectedInfoDoc.icon size={28} />
                </div>
                <h3 className="text-2xl font-black text-black dark:text-white">{selectedInfoDoc.name}</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Brief Summary</h4>
                  <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{selectedInfoDoc.summary}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">The &quot;Why&quot;</h4>
                  <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{selectedInfoDoc.why}</p>
                </div>

                {selectedInfoDoc.passwordHint && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-2">Password Hint</h4>
                    <p className="text-primary/80 font-medium font-mono text-sm mb-3">{selectedInfoDoc.passwordHint}</p>
                    {selectedInfoDoc.passwordHint.includes("PAN") && (
                      <button 
                        onClick={() => copyToClipboard("ABCDE1234F")}
                        className="flex items-center gap-2 text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Copy size={14} /> Copy Example PAN
                      </button>
                    )}
                  </div>
                )}
                
                {selectedInfoDoc.externalLink && (
                  <a 
                    href={selectedInfoDoc.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-black dark:text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Open Official Portal <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="py-24 px-6 lg:px-12 relative z-10 bg-gray-50/50 dark:bg-black/20">
        {notice && (
          <div className={`mx-auto mb-6 max-w-7xl rounded-2xl border p-4 text-sm font-semibold ${
            notice.type === "success"
              ? "border-green-600/20 bg-green-600/10 text-green-700 dark:text-green-300"
              : notice.type === "error"
                ? "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300"
                : "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300"
          }`}>
            {notice.message}
          </div>
        )}

        
        {/* Progress Indicator */}
        {hasCompletedPreFlight && (
          <div className="absolute top-12 right-6 lg:right-12 z-20 flex items-center gap-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-3 pr-6 rounded-full border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-100 dark:text-gray-800"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <motion.path
                  className="text-primary transition-all duration-500 ease-out"
                  strokeDasharray={`${completionPercentage}, 100`}
                  strokeWidth="3"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-xs font-bold">{completionPercentage}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Overall Progress</span>
              <span className="text-sm font-black text-black dark:text-white">Document Checklist</span>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 pt-12">
          
          {/* Left Column: Vertical Timeline */}
          <div className="lg:col-span-6 xl:col-span-5 relative pb-32">
            <div>
              <h2 className="text-4xl lg:text-5xl font-black mb-4 leading-tight text-black dark:text-white">
                Your <span className="text-primary">Filing Journey</span>
              </h2>
              
              <div className="mb-10 bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 rounded-r-xl">
                <h3 className="text-blue-800 dark:text-blue-400 font-bold text-lg mb-1">&quot;Step-by-step, stress-free.&quot;</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium leading-relaxed">
                  Filing ITR isn&apos;t a one-minute job. We save your progress. Upload your docs as you get them, and we&apos;ll tell you exactly what&apos;s missing for a successful &apos;No-Defect&apos; return.
                </p>
              </div>
              
              <div className="relative ml-4 space-y-24 pb-64" ref={timelineRef}>
                <div className="absolute left-[11px] top-4 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800" />
                <motion.div 
                  className="absolute left-[11px] top-4 bottom-0 w-0.5 bg-primary origin-top" 
                  style={{ scaleY }} 
                />

                <AnimatePresence>
                  {hasCompletedPreFlight && filingSteps.map((step, index) => {
                    const isActive = activeStepId === step.id;
                    const isCompleted = isStepComplete(step.id);
                    
                    return (
                      <motion.div
                        key={step.id}
                        id={step.id}
                        ref={(el: HTMLDivElement | null) => { stepRefs.current[index] = el; }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{
                          opacity: isActive ? 1 : 0.5,
                          x: 0,
                          scale: isActive ? 1.02 : 1,
                        }}
                        transition={{ duration: 0.5 }}
                        className="relative pl-10 group cursor-default"
                      >
                        <div className="absolute -left-[13px] top-1 z-10 flex items-center justify-center">
                          {isCompleted ? (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.6)]"
                            >
                              <CheckCircle2 size={14} className="text-white" />
                            </motion.div>
                          ) : (
                            <motion.div 
                              className={`w-6 h-6 rounded-full border-4 ${
                                isActive 
                                  ? "bg-primary border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.6)]" 
                                  : "bg-white dark:bg-background border-gray-300 dark:border-gray-700"
                              } transition-colors duration-300`}
                            />
                          )}
                        </div>
                        
                        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-100/50 dark:border-gray-800/50 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl dark:group-hover:shadow-[0_10px_30px_-15px_rgba(var(--primary),0.1)]">
                          <h3 className={`text-xl font-bold mb-2 ${isActive ? "text-primary" : "text-black dark:text-white"}`}>
                            Step {index + 1}: {step.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 font-medium">
                            {step.description}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Column: Pre-Flight or Checklist */}
          <div className="lg:col-span-6 xl:col-span-7 relative pt-4">
            <div className="sticky top-24 space-y-6">
              
              {/* Pre-Flight Flow */}
              {!hasCompletedPreFlight && !isGenerating && (
                <div className="h-[400px] flex items-center justify-center">
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={questionStep}
                      custom={direction}
                      variants={questionVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-2xl w-full max-w-lg relative"
                    >
                      {questionStep > 0 && (
                        <button 
                          onClick={handleBack}
                          className="absolute top-6 left-6 text-gray-400 hover:text-primary transition-colors flex items-center gap-1 text-sm font-bold"
                        >
                          <ArrowLeft size={16} /> Back
                        </button>
                      )}
                      
                      <h3 className="text-xs font-black text-primary uppercase tracking-wider mb-4 mt-6">
                        Pre-Flight Check {questionStep + 1} of {QUESTIONS.length}
                      </h3>
                      <h4 className="text-2xl font-bold text-black dark:text-white mb-8 leading-snug">
                        {QUESTIONS[questionStep].text}
                      </h4>
                      
                      <div className="space-y-3">
                        {QUESTIONS[questionStep].options.map(option => (
                          <button
                            key={option}
                            onClick={() => handleAnswer(option)}
                            className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-left font-bold text-gray-700 dark:text-gray-300 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all flex justify-between items-center group"
                          >
                            {option}
                            <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}

              {/* Magic Reveal Loading State */}
              {isGenerating && (
                <div className="h-[400px] flex flex-col items-center justify-center">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary mb-6 shadow-[0_0_30px_rgba(var(--primary),0.3)]"
                  />
                  <motion.h3 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xl font-bold text-black dark:text-white"
                  >
                    Building your personalized checklist...
                  </motion.h3>
                </div>
              )}

              {/* Document Drag & Drop Checklist */}
              {hasCompletedPreFlight && (
                <>
                  <motion.div 
                    className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl p-4 md:p-6 flex items-start gap-4 overflow-hidden backdrop-blur-sm shadow-lg shadow-primary/5"
                    layout
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-[40px] rounded-full pointer-events-none" />
                    <div className="shrink-0 p-3 bg-primary text-white rounded-xl shadow-md shadow-primary/30 relative">
                      <Bot size={24} />
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white dark:border-background animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">AI Assistant</h4>
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={activeStepData.id}
                          initial={{ opacity: 0, y: 5, filter: "blur(2px)" }}
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          exit={{ opacity: 0, y: -5, filter: "blur(2px)" }}
                          transition={{ duration: 0.2 }}
                          className="text-base font-medium text-black dark:text-white leading-relaxed"
                        >
                          &quot;{activeStepData.botTip}&quot;
                        </motion.p>
                      </AnimatePresence>
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                    
                    {/* Pending List */}
                    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col shadow-sm relative z-50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-gray-500 dark:text-gray-400">To Gather</h4>
                          <button 
                            onClick={handleStartOver}
                            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-primary bg-gray-100 hover:bg-primary/10 dark:bg-gray-800 dark:hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors"
                          >
                            <RotateCcw size={12} /> Start Over
                          </button>
                        </div>
                        <span className="text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">{pendingDocs.length}</span>
                      </div>
                      
                      <div className="flex-1 relative z-50">
                        {pendingDocs.length === 0 && (
                          <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="h-full min-h-[100px] flex items-center justify-center text-sm font-medium text-gray-400 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl p-4"
                          >
                            All gathered!
                          </motion.div>
                        )}
                        <motion.div 
                          variants={listContainerVariants}
                          initial="hidden"
                          animate="show"
                        >
                          {pendingDocs.map((doc, index) => (
                            <motion.div
                              variants={listItemVariants}
                              layout
                              key={doc.id}
                              className="mb-3"
                            >
                              <motion.div
                                // Anti-gravity floating animation
                                animate={{ y: [0, -5, 0] }}
                                transition={{ 
                                  repeat: Infinity, 
                                  duration: 3 + (index % 5) * 0.4,
                                  ease: "easeInOut" 
                                }}
                              >
                                <motion.div
                                  id={`drag-${doc.id}`}
                                  drag
                                  dragSnapToOrigin
                                  whileDrag={{ scale: 1.05, boxShadow: "0px 10px 30px rgba(0,0,0,0.1)", zIndex: 100 }}
                                  onDragEnd={(e, info) => handleDragEnd(e, info, doc.id)}
                                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-black rounded-xl border border-gray-100 dark:border-gray-800 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors group relative z-10"
                                >
                                  <GripVertical size={16} className="text-gray-400 group-hover:text-primary transition-colors" />
                                  <doc.icon size={20} className="text-gray-500 dark:text-gray-400 shrink-0" />
                                  <span className="font-semibold text-sm text-black dark:text-white flex-1 truncate">{doc.name}</span>
                                  
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => setSelectedInfoDoc(doc)}
                                      className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                      title="Documentation"
                                    >
                                      <Info size={14} />
                                    </button>
                                    
                                    {doc.externalLink && (
                                      <a 
                                        href={doc.externalLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-1.5 bg-gray-200/50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                                        title="Open IT Portal"
                                      >
                                        <ExternalLink size={14} />
                                      </a>
                                    )}
                                  </div>
                                </motion.div>
                              </motion.div>
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                    </div>

                    {/* Ready List (Drop Zone) */}
                    <motion.div 
                      ref={readyZoneRef}
                      style={{ scale: readyZoneScale }}
                      className="bg-green-50/50 dark:bg-green-950/20 backdrop-blur-md rounded-2xl border-2 border-dashed border-green-200 dark:border-green-900/50 p-6 flex flex-col transition-colors shadow-sm relative z-10 origin-top"
                    >
                       <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-green-700 dark:text-green-500">Ready Zone</h4>
                        <div className="flex items-center gap-2">
                          {(scanningDocs.length > 0) && (
                            <span className="text-xs font-bold text-blue-600 animate-pulse flex items-center gap-1">
                              <Loader2 size={12} className="animate-spin" /> Scanning
                            </span>
                          )}
                          <span className="text-xs font-bold px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 rounded-full">{readyDocs.length}</span>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <AnimatePresence mode="popLayout">
                          {readyDocs.length === 0 && scanningDocs.length === 0 && (
                            <motion.div 
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className="h-full min-h-[100px] flex items-center justify-center text-sm font-medium text-green-600/50 dark:text-green-500/50 rounded-xl p-4 text-center pointer-events-none"
                            >
                              Drag documents here<br/>when ready
                            </motion.div>
                          )}

                          {scanningDocs.map(doc => (
                            <motion.div
                              layout
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0 }}
                              key={`scanning-${doc.id}`}
                              className="mb-3 flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
                            >
                              <Loader2 size={20} className="text-blue-500 animate-spin shrink-0" />
                              <span className="font-semibold text-sm text-blue-700 dark:text-blue-300 flex-1 truncate">Verifying {doc.name}...</span>
                            </motion.div>
                          ))}

                          {readyDocs.map((doc) => (
                            <motion.div
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              key={doc.id}
                              className="mb-3 flex items-center gap-3 p-3 bg-white dark:bg-black rounded-xl border border-green-200 dark:border-green-800 shadow-sm"
                            >
                              <CheckCircle2 size={20} className="text-green-600 dark:text-green-500 shrink-0" />
                              <span className="font-semibold text-sm text-black dark:text-white opacity-70 flex-1 truncate line-through">{doc.name}</span>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                    
                  </div>

                  <AnimatePresence>
                    {isAllComplete && (
                      <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="pt-6"
                      >
                        <button 
                          onClick={() => setNotice({ type: "info", message: "Your document checklist is ready. Continue from the main workspace to finish filing." })}
                          className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-lg shadow-primary/30 hover:bg-primary/90 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                        >
                          <CheckCircle size={24} />
                          Finalize Filing
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

            </div>
          </div>
        </div>
      </section>
    </>
  );
}
