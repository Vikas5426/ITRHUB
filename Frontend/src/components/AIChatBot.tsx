"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, Loader2, Info } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  sources?: string[];
}

export function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      content: "Hi! I'm your ITRHUB Tax Assistant. How can I help you today?",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
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
        content: "Sorry, I am having trouble connecting to the server right now. Please try again later.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
            className="fixed bottom-6 right-6 p-4 rounded-full bg-black dark:bg-white text-white dark:text-black shadow-2xl hover:scale-110 transition-transform z-50 flex items-center justify-center"
          >
            <MessageSquare size={24} />
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
            className="fixed bottom-6 right-6 w-[380px] h-[600px] max-h-[80vh] flex flex-col z-50 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.1)] border-[0.5px] border-white/20 dark:border-white/10 bg-white/80 dark:bg-black/60 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200/50 dark:border-white/10 bg-white/50 dark:bg-black/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                  <Bot size={18} className="text-black dark:text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-black dark:text-white">ITRHUB Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Online & Ready</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
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
                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 shrink-0 flex items-center justify-center mt-1">
                      <Bot size={12} className="text-gray-600 dark:text-gray-300" />
                    </div>
                  )}

                  <div className="flex flex-col max-w-[80%]">
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm ${msg.role === "user"
                          ? "bg-black dark:bg-white text-white dark:text-black rounded-tr-none"
                          : "bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 rounded-tl-none prose prose-sm dark:prose-invert"
                        }`}
                    >
                      {msg.role === "user" ? (
                        msg.content
                      ) : (
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      )}
                    </div>

                    {/* Source Snippets rendering */}
                    {msg.role === "ai" && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                          <Info size={10} />
                          Sources
                        </p>
                        {msg.sources.map((source, idx) => (
                          <details key={idx} className="group text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded px-2 py-1 cursor-pointer">
                            <summary className="font-medium outline-none">Tax Document {idx + 1}</summary>
                            <div className="mt-1 p-2 bg-white dark:bg-black/40 rounded border border-gray-100 dark:border-white/5 whitespace-pre-wrap leading-relaxed text-[11px]">
                              {source}
                            </div>
                          </details>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 shrink-0 flex items-center justify-center mt-1">
                    <Bot size={12} className="text-gray-600 dark:text-gray-300" />
                  </div>
                  <div className="bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-gray-200/50 dark:border-white/10 bg-white/50 dark:bg-black/40">
              <form
                onSubmit={handleSubmit}
                className="relative flex items-center bg-gray-100 dark:bg-white/5 rounded-full border border-transparent focus-within:border-gray-300 dark:focus-within:border-white/20 transition-colors"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a tax question..."
                  className="w-full bg-transparent px-4 py-3 text-sm text-black dark:text-white placeholder-gray-500 outline-none rounded-full"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1.5 p-2 bg-black dark:bg-white text-white dark:text-black rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
