"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  Calendar,
  CalendarClock,
  CheckCircle,
  CheckCircle2,
  Clock,
  Clock3,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileWarning,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { DEADLINES_DATA, computeStatus, Deadline } from "./data";
import { PenaltyCalculator } from "./PenaltyCalculator";

export function TrackCommandCenter() {
  const [filter, setFilter] = useState<string>("All");
  const [doneDeadlines, setDoneDeadlines] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filters = ["All", "ITR", "Advance Tax", "Audit", "TDS"];

  const toggleDone = (id: string) => {
    setDoneDeadlines((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const deadlines = DEADLINES_DATA.map((d) => ({
    ...d,
    status: computeStatus(d.date, doneDeadlines.has(d.id)),
  }));

  const filteredDeadlines = deadlines.filter((d) => filter === "All" || d.type === filter);

  const actionCards = [
    {
      title: "Complete Proof Ingestion",
      text: "AIS/TIS, 26AS, and health insurance certificates are required to verify TDS and deductions.",
      href: "/intake?section=documents",
      action: "Upload in Intake",
      tone: "amber",
      icon: FileWarning,
    },
    {
      title: "Validate Return Schedules",
      text: "Schedule Salary, Schedule CG, and Bank verification are drafted and ready for validation.",
      href: "/analysis?section=return",
      action: "Review in Analysis",
      tone: "green",
      icon: CheckCircle2,
    },
    {
      title: "Pre-Validate Refund Bank Account",
      text: "Ensure your primary bank account is pre-validated on the IT portal for seamless refund credit.",
      href: "/analysis?section=return",
      action: "Check Bank Details",
      tone: "blue",
      icon: CreditCard,
    },
  ];

  const exportICS = () => {
    let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ITRHUB//Tax Tracker//EN\n";
    deadlines.forEach((d) => {
      const dateStr = d.date.replace(/-/g, "");
      ics += "BEGIN:VEVENT\n";
      ics += `UID:${d.id}-2026@itrhub.com\n`;
      ics += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z\n`;
      ics += `DTSTART;VALUE=DATE:${dateStr}\n`;
      ics += `SUMMARY:${d.name}\n`;
      ics += `DESCRIPTION:${d.penalty}\n`;
      ics += "END:VEVENT\n";
    });
    ics += "END:VCALENDAR";

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "itrhub_tax_calendar_AY2026-27.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="space-y-8">
      {/* Priority Action Items */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} className="text-primary" />
          <h2 className="text-lg font-black text-foreground">Immediate Filing Actions</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {actionCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className="flex flex-col justify-between rounded-3xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg group"
              >
                <div>
                  <div className="mb-4 flex items-start justify-between">
                    <div
                      className={`rounded-2xl p-3 ${
                        card.tone === "amber"
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                          : card.tone === "green"
                          ? "bg-green-600/10 text-green-700 dark:text-green-300"
                          : "bg-blue-500/10 text-blue-700 dark:text-blue-300"
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                      Action Required
                    </span>
                  </div>
                  <h3 className="font-black text-base text-foreground">{card.title}</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{card.text}</p>
                </div>

                <div className="mt-5 flex items-center justify-between pt-3 border-t border-border/40 text-xs font-black text-primary group-hover:translate-x-0.5 transition-transform">
                  <span>{card.action}</span>
                  <ArrowRight size={14} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Deadlines & Penalty Calculator */}
      <div className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
        {/* Deadlines Section */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-primary" />
                <h3 className="text-xl font-black text-foreground">AY 2026-27 Statutory Deadlines</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Filter by income tax return type, advance tax quarters, and audit milestones.
              </p>
            </div>

            <button
              onClick={exportICS}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3.5 py-1.5 text-xs font-bold hover:bg-muted transition-all shadow-xs"
            >
              <Download size={13} />
              <span>Export .ICS Calendar</span>
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all ${
                  filter === f
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Deadlines Cards */}
          <div className="space-y-3">
            {filteredDeadlines.map((item) => {
              const isDone = doneDeadlines.has(item.id);
              const isExpanded = expandedId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className={`rounded-2xl border p-4 transition-all cursor-pointer ${
                    isDone
                      ? "bg-muted/20 border-border/40 opacity-75"
                      : "bg-card border-border hover:border-primary/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDone(item.id);
                        }}
                        className={`size-6 rounded-lg flex items-center justify-center border transition-all mt-0.5 ${
                          isDone
                            ? "bg-green-600 border-green-600 text-white"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {isDone && <CheckCircle size={14} />}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`font-black text-sm ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {item.name}
                          </h4>
                          {item.percentage && (
                            <span className="rounded-full bg-blue-500/10 px-2 py-0.2 text-[10px] font-black text-blue-600 dark:text-blue-400">
                              {item.percentage}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-muted-foreground mt-0.5">Due: {item.displayDate}, 2026</p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                        item.status === "Overdue"
                          ? "bg-red-500/10 text-red-600 dark:text-red-400"
                          : item.status === "Due Soon"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : item.status === "Done"
                          ? "bg-muted text-muted-foreground"
                          : "bg-green-500/10 text-green-600 dark:text-green-400"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border/40 text-xs">
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold bg-red-500/5 p-2.5 rounded-xl border border-red-500/10">
                        <AlertTriangle size={15} className="shrink-0" />
                        <span>Penalty Clause: {item.penalty}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Penalty & Interest Calculator Column */}
        <div>
          <PenaltyCalculator />
        </div>
      </div>

      {/* Post-Filing Lifecycle Monitor */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck size={22} className="text-primary" />
          <div>
            <h3 className="text-xl font-black text-foreground">Post-Filing Return Lifecycle Monitor</h3>
            <p className="text-xs text-muted-foreground">What happens after you export and submit your return JSON</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          {[
            {
              step: "01",
              title: "Return Upload & JSON",
              desc: "Submit your generated JSON on the e-filing portal (incometax.gov.in).",
              status: "Ready to Export",
            },
            {
              step: "02",
              title: "Aadhaar / EVC E-Verification",
              desc: "Verify within 30 days via Aadhaar OTP, net banking, or Demat EVC.",
              status: "Required in 30 Days",
            },
            {
              step: "03",
              title: "CPC Processing & 143(1)",
              desc: "Centralized Processing Center processes return and issues intimation notice.",
              status: "Automatic by ITD",
            },
            {
              step: "04",
              title: "Refund Credit / Demand",
              desc: "Refund directly credited to pre-validated bank account via ECS.",
              status: "Track via NSDL",
            },
          ].map((item) => (
            <div key={item.step} className="rounded-2xl border border-border/60 bg-muted/20 p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Stage {item.step}
                </span>
                <h4 className="mt-1 font-black text-sm text-foreground">{item.title}</h4>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/30">
                <span className="text-[10px] font-black uppercase text-primary">{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

