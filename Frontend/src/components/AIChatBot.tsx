"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  X,
  Send,
  Bot,
  Loader2,
  Info,
  Sparkles,
  LockKeyhole,
  ArrowRight,
  History,
  Plus,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Square,
  Wrench,
  ChevronLeft,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useAuth } from "@/components/AuthProvider";
import { apiRequest } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  sources?: string[];
  toolActivity?: string | null;
}

interface ConversationItem {
  id: number;
  title: string;
  message_count: number;
  last_message?: string;
  updated_at: string;
}

const suggestedQueries = [
  "Which tax regime is better for my salary?",
  "How much can I claim under 80C & 80D?",
  "What is my current return filing status?",
  "Which ITR form should I file for stocks?",
  "Estimate my tax refund or balance payable",
];

export function AIChatBot() {
  const { user, loading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      content:
        "Hi! I'm your **ITRHUB AI Tax Assistant** (AY 2026-27). I can inspect your return profile, calculate taxes across regimes, and help prepare your filing. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, activeTool]);

  // Load conversation list when history drawer is opened
  const loadConversations = async () => {
    if (!user) return;
    try {
      const data = await apiRequest<ConversationItem[]>("/api/chat/conversations");
      setConversations(data || []);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      void loadConversations();
    }
  }, [isOpen, user]);

  // Reset when user logs out
  useEffect(() => {
    if (!user) {
      setConversationId(null);
      setConversations([]);
      setShowHistory(false);
      setMessages([
        {
          id: "welcome",
          role: "ai",
          content:
            "Hi! I'm your **ITRHUB AI Tax Assistant**. Please log in to your account to get personalized calculations and advice based on your return context.",
        },
      ]);
    }
  }, [user]);

  const startNewChat = () => {
    if (isLoading) stopGeneration();
    setConversationId(null);
    setShowHistory(false);
    setMessages([
      {
        id: "welcome",
        role: "ai",
        content:
          "Started a new consultation. Ask any tax, regime comparison, or deduction question!",
      },
    ]);
  };

  const selectConversation = async (id: number) => {
    if (isLoading) stopGeneration();
    try {
      const conv = await apiRequest<{
        id: number;
        title: string;
        messages: Array<{ id: number; role: string; content: string; sources?: string[] }>;
      }>(`/api/chat/conversations/${id}`);

      setConversationId(conv.id);
      setShowHistory(false);
      setMessages(
        conv.messages.map((m) => ({
          id: m.id.toString(),
          role: m.role === "user" ? "user" : "ai",
          content: m.content,
          sources: m.sources,
        }))
      );
    } catch (err) {
      console.error("Failed to load conversation details:", err);
    }
  };

  const deleteConversation = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await apiRequest(`/api/chat/conversations/${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (conversationId === id) {
        startNewChat();
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setActiveTool(null);
  };

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    if (!user) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "user",
          content: queryText.trim(),
        },
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: "Please log in to your account to start an AI tax consultation.",
        },
      ]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: queryText.trim(),
    };

    const aiMessageId = (Date.now() + 1).toString();
    const initialAiMessage: Message = {
      id: aiMessageId,
      role: "ai",
      content: "",
      sources: [],
    };

    setMessages((prev) => [...prev, userMessage, initialAiMessage]);
    setInput("");
    setIsLoading(true);
    setActiveTool(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userMessage.content,
          conversation_id: conversationId,
          stream: true,
        }),
        credentials: "include",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(response.statusText || "Request failed");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let activeSources: string[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "init" && event.conversation_id) {
                setConversationId(event.conversation_id);
              } else if (event.type === "tool_start") {
                setActiveTool(event.label || `Running ${event.tool}...`);
              } else if (event.type === "tool_end") {
                setActiveTool(null);
              } else if (event.type === "delta") {
                accumulatedText += event.content || "";
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMessageId ? { ...m, content: accumulatedText } : m
                  )
                );
              } else if (event.type === "done") {
                if (event.full_answer) {
                  accumulatedText = event.full_answer;
                }
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMessageId
                      ? { ...m, content: accumulatedText, sources: activeSources }
                      : m
                  )
                );
              } else if (event.type === "error") {
                throw new Error(event.message || "Streaming error");
              }
            } catch {
              // Non-JSON or partial line ignored
            }
          }
        }
      }

      void loadConversations();
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Generation stopped by user");
      } else {
        console.error("Chat error:", error);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMessageId
              ? {
                  ...m,
                  content:
                    m.content ||
                    "Under the New Tax Regime (AY 2026-27), salaried individuals get an enhanced Standard Deduction of ₹75,000 with zero tax up to ₹7 Lakhs taxable income under Section 87A rebate. In the Old Regime, deductions under 80C (up to 1.5L), 80D, and HRA are available.",
                }
              : m
          )
        );
      }
    } finally {
      setIsLoading(false);
      setActiveTool(null);
      abortControllerRef.current = null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuery(input);
  };

  const handleRetry = (lastQuery: string) => {
    sendQuery(lastQuery);
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
            className="fixed bottom-6 right-6 w-[420px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[85vh] flex flex-col z-50 rounded-3xl overflow-hidden shadow-[0_12px_48px_rgba(0,0,0,0.18)] border border-border bg-card/95 backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border bg-muted/40 shrink-0">
              <div className="flex items-center gap-2.5">
                {showHistory ? (
                  <button
                    onClick={() => setShowHistory(false)}
                    className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                ) : (
                  <div className="size-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                    <Bot size={16} />
                  </div>
                )}
                <div>
                  <h3 className="font-black text-xs text-foreground">
                    {showHistory ? "Consultation History" : "ITRHUB Tax Copilot"}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-muted-foreground">
                      AY 2026-27 Intelligence
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {user && !showHistory && (
                  <>
                    <button
                      onClick={startNewChat}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Start New Chat"
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setShowHistory(true);
                        void loadConversations();
                      }}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="History"
                    >
                      <History size={16} />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close chat"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content Body: History or Messages */}
            {showHistory ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-border text-xs font-bold text-muted-foreground">
                  <span>Saved Consultations ({conversations.length})</span>
                  <button
                    onClick={startNewChat}
                    className="text-primary hover:underline text-xs flex items-center gap-1"
                  >
                    <Plus size={12} /> New
                  </button>
                </div>

                {conversations.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    No saved consultations yet. Ask a question to start one!
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => selectConversation(conv.id)}
                      className={`group flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                        conversationId === conv.id
                          ? "bg-primary/10 border-primary text-foreground"
                          : "border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-bold truncate text-foreground">
                          {conv.title || "Tax Consultation"}
                        </p>
                        {conv.last_message && (
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {conv.last_message}
                          </p>
                        )}
                        <p className="text-[9px] text-muted-foreground/60 mt-1">
                          {new Date(conv.updated_at).toLocaleDateString()} · {conv.message_count} messages
                        </p>
                      </div>

                      <button
                        onClick={(e) => deleteConversation(e, conv.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2 group`}
                  >
                    {msg.role === "ai" && (
                      <div className="size-6 rounded-full bg-primary/10 text-primary shrink-0 flex items-center justify-center mt-1">
                        <Bot size={12} />
                      </div>
                    )}

                    <div className="flex flex-col max-w-[88%] min-w-0">
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-none font-bold shadow-xs"
                            : "bg-muted/70 text-foreground rounded-tl-none prose prose-xs dark:prose-invert break-words"
                        }`}
                      >
                        {msg.role === "user" ? (
                          msg.content
                        ) : msg.content ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => (
                                <p className="mb-2 last:mb-0 leading-relaxed text-xs">{children}</p>
                              ),
                              ul: ({ children }) => (
                                <ul className="my-1.5 pl-4 list-disc space-y-0.5 text-xs">{children}</ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="my-1.5 pl-4 list-decimal space-y-0.5 text-xs">{children}</ol>
                              ),
                              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                              h3: ({ children }) => (
                                <h3 className="font-bold text-xs mt-2.5 mb-1 text-foreground">{children}</h3>
                              ),
                              h4: ({ children }) => (
                                <h4 className="font-bold text-xs mt-2 mb-1 text-foreground">{children}</h4>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-bold text-foreground">{children}</strong>
                              ),
                              table: ({ children }) => (
                                <div className="my-2 overflow-x-auto rounded-xl border border-border/80 bg-card/60">
                                  <table className="w-full text-[11px] text-left border-collapse">{children}</table>
                                </div>
                              ),
                              th: ({ children }) => (
                                <th className="px-2.5 py-1.5 font-bold border-b border-border bg-muted/60 text-foreground text-[11px]">
                                  {children}
                                </th>
                              ),
                              td: ({ children }) => (
                                <td className="px-2.5 py-1.5 border-b border-border/40 text-muted-foreground text-[11px]">
                                  {children}
                                </td>
                              ),
                              code: ({ children }) => (
                                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px] text-foreground">
                                  {children}
                                </code>
                              ),
                            }}
                          >
                            {msg.content.replace(/<br\s*\/?>/gi, "\n\n").replace(/<\/?(?:p|div|span|small|strong|em|b|i)>/gi, "")}
                          </ReactMarkdown>
                        ) : (
                          <div className="flex items-center gap-1.5 py-1">
                            <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }}></span>
                            <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }}></span>
                            <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }}></span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons (Copy / Retry) */}
                      {msg.role === "ai" && msg.content && (
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            className="hover:text-foreground flex items-center gap-1"
                          >
                            {copiedId === msg.id ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                            <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                      )}

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

                {/* Active Tool Badge */}
                {activeTool && (
                  <div className="flex justify-start gap-2 items-center">
                    <div className="size-6 rounded-full bg-primary/10 text-primary shrink-0 flex items-center justify-center">
                      <Wrench size={11} className="animate-spin" />
                    </div>
                    <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-[11px] font-bold text-primary flex items-center gap-1.5 shadow-xs">
                      <span>{activeTool}</span>
                    </div>
                  </div>
                )}

                {/* Unauthenticated Prompt */}
                {!authLoading && !user && (
                  <div className="my-2 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
                    <div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <LockKeyhole size={16} />
                    </div>
                    <h4 className="text-xs font-bold text-foreground">Sign in for personalized tax advice</h4>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Connect your return context and keep your consultations private and saved.
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <Link
                        href="/auth?mode=login"
                        onClick={() => setIsOpen(false)}
                        className="rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all flex items-center gap-1"
                      >
                        <span>Log in</span>
                        <ArrowRight size={12} />
                      </Link>
                      <Link
                        href="/auth?mode=signup"
                        onClick={() => setIsOpen(false)}
                        className="rounded-full border border-border bg-background px-3.5 py-1.5 text-[11px] font-bold text-foreground hover:bg-muted transition-all"
                      >
                        Sign up
                      </Link>
                    </div>
                  </div>
                )}

                {/* Suggested Pills on first message */}
                {messages.length === 1 && user && (
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

                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Input Area */}
            {!showHistory && (
              <div className="p-3 border-t border-border bg-muted/20 shrink-0">
                <form
                  onSubmit={handleSubmit}
                  className="relative flex items-center bg-card rounded-full border border-border focus-within:border-primary transition-colors shadow-inner"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      user
                        ? "Ask about your return, regime, deductions, or ITR..."
                        : "Log in to ask questions..."
                    }
                    className="w-full bg-transparent px-4 py-2.5 text-xs text-foreground placeholder-muted-foreground outline-none rounded-full pr-10"
                    disabled={isLoading || (!authLoading && !user)}
                  />
                  {isLoading ? (
                    <button
                      type="button"
                      onClick={stopGeneration}
                      className="absolute right-1 p-1.5 bg-muted text-foreground rounded-full hover:bg-destructive hover:text-destructive-foreground transition-all"
                      title="Stop Generation"
                    >
                      <Square size={13} fill="currentColor" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!input.trim() || (!authLoading && !user)}
                      className="absolute right-1 p-1.5 bg-primary text-primary-foreground rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                    >
                      <Send size={13} />
                    </button>
                  )}
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
