"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, Loader2, Info, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  sources?: string[];
}

const suggestedQueries = [
  "Old vs New Regime?",
  "Which ITR form for stocks?",
  "How to claim HRA exemption?",
  "Section 80D medical limit?",
  "What is 234F penalty fee?",
];

export function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      content: "Hi! I'm your ITRHUB Tax Assistant. How can I help you optimize your return or understand Indian tax rules today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: queryText.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage.content, session_id: "demo-user" }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: data.answer,
        sources: data.sources,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: "Under the New Tax Regime (AY 2026-27), salaried individuals get an enhanced Standard Deduction of ₹75,000 with zero tax up to ₹7 Lakhs taxable income under Section 87A rebate. In the Old Regime, deductions under 80C (up to 1.5L), 80D, and HRA are available.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuery(input);
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 p-4 rounded-full bg-primary text-primary-foreground shadow-2xl hover:scale-110 transition-transform z-50 flex items-center justify-center gap-2 group"
          >
            <Bot size={22} />
            <span className="hidden sm:inline text-xs font-black">Ask Tax AI</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-6 right-6 w-[380px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[82vh] flex flex-col z-50 rounded-3xl overflow-hidden shadow-[0_12px_48px_rgba(0,0,0,0.18)] border border-border bg-card/95 backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="font-black text-sm text-foreground">ITRHUB Tax Copilot</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[11px] font-bold text-muted-foreground">AY 2026-27 Knowledge</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}
                >
                  {msg.role === "ai" && (
                    <div className="size-6 rounded-full bg-muted shrink-0 flex items-center justify-center mt-1">
                      <Bot size={12} className="text-primary" />
                    </div>
                  )}

                  <div className="flex flex-col max-w-[85%]">
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-none font-bold shadow-xs"
                          : "bg-muted/80 text-foreground rounded-tl-none prose prose-xs dark:prose-invert"
                      }`}
                    >
                      {msg.role === "user" ? (
                        msg.content
                      ) : (
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      )}
                    </div>

                    {/* Source Snippets */}
                    {msg.role === "ai" && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider flex items-center gap-1">
                          <Info size={10} />
                          Statutory Citations
                        </p>
                        {msg.sources.map((source, idx) => (
                          <details key={idx} className="group text-[11px] text-muted-foreground bg-muted/40 border border-border rounded-xl px-2.5 py-1 cursor-pointer">
                            <summary className="font-bold outline-none">Income Tax Act Provision {idx + 1}</summary>
                            <div className="mt-1 p-2 bg-background rounded-lg border border-border whitespace-pre-wrap leading-relaxed text-[10px]">
                              {source}
                            </div>
                          </details>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Suggested Pills on first message */}
              {messages.length === 1 && (
                <div className="pt-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                    <Sparkles size={11} className="text-primary" />
                    Suggested Questions
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedQueries.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendQuery(q)}
                        className="rounded-full border border-border bg-card px-3 py-1 text-[11px] font-bold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-left shadow-xs"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="flex justify-start gap-2">
                  <div className="size-6 rounded-full bg-muted shrink-0 flex items-center justify-center mt-1">
                    <Bot size={12} className="text-primary" />
                  </div>
                  <div className="bg-muted text-foreground px-4 py-2.5 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-border bg-muted/20">
              <form
                onSubmit={handleSubmit}
                className="relative flex items-center bg-card rounded-full border border-border focus-within:border-primary transition-colors shadow-inner"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask any tax, regime, or schedule question..."
                  className="w-full bg-transparent px-4 py-2.5 text-xs text-foreground placeholder-muted-foreground outline-none rounded-full"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1 p-1.5 bg-primary text-primary-foreground rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                >
                  {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
