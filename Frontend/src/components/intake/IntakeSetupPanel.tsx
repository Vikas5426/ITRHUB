"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Loader2,
  Plus,
  Pencil,
  Check,
  X,
  Trash2,
  Calendar,
  FileText,
  AlertCircle,
} from "lucide-react";
import { useTaxWorkspace } from "@/context/TaxWorkspaceContext";

function ayLabel(start: number) {
  return `AY ${start}-${String(start + 1).slice(-2)}`;
}

function fyLabel(start: number) {
  return `FY ${start - 1}-${String(start).slice(-2)}`;
}

const ITR_OPTIONS = [
  { id: "ITR-1", label: "ITR-1 (Sahaj)", desc: "Salaried, pension, single house property, other sources < ₹50L" },
  { id: "ITR-2", label: "ITR-2", desc: "Capital gains, multiple properties, foreign assets, agricultural > ₹5k" },
  { id: "ITR-3", label: "ITR-3", desc: "Business & profession profits, F&O trading, proprietary firms" },
  { id: "ITR-4", label: "ITR-4 (Sugam)", desc: "Presumptive business/profession (Sec 44AD, 44ADA, 44AE)" },
];

const AY_OPTIONS = [
  { start: 2026, label: "AY 2026-27 (Current FY 2025-26)" },
  { start: 2025, label: "AY 2025-26 (Past FY 2024-25)" },
  { start: 2024, label: "AY 2024-25 (Prior FY 2023-24)" },
];

const SUGGESTED_NAMES = [
  "My Primary Return",
  "Spouse Return",
  "Parent Return",
  "Freelance & Consulting",
  "Family HUF",
];

export function IntakeSetupPanel() {
  const {
    profiles,
    activeProfile,
    filings,
    activeFiling,
    addReturn,
    updateReturnName,
    deleteFiling,
    selectFiling,
    loading,
  } = useTaxWorkspace();

  // Add Return Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReturnName, setNewReturnName] = useState("");
  const [newAyStart, setNewAyStart] = useState(2026);
  const [newItrForm, setNewItrForm] = useState("ITR-1");
  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState("");

  // Inline editing state: filingId -> string
  const [editingFilingId, setEditingFilingId] = useState<number | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Deleting state
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [generalError, setGeneralError] = useState("");

  function openAddModal() {
    const defaultName =
      filings.length === 0
        ? profiles[0]?.display_name || "My Primary Return"
        : `Return ${filings.length + 1}`;
    setNewReturnName(defaultName);
    setNewAyStart(2026);
    setNewItrForm("ITR-1");
    setModalError("");
    setShowAddModal(true);
  }

  async function handleAddReturnSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newReturnName.trim();
    if (!trimmed) {
      setModalError("Please enter a name for the tax return");
      return;
    }

    setModalBusy(true);
    setModalError("");
    try {
      await addReturn({
        returnName: trimmed,
        assessmentYearStart: newAyStart,
        itrForm: newItrForm,
      });
      setShowAddModal(false);
    } catch (err: any) {
      setModalError(err?.message || "Failed to create return workspace");
    } finally {
      setModalBusy(false);
    }
  }

  function startEditing(filingId: number, currentName: string, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingFilingId(filingId);
    setEditNameValue(currentName);
  }

  async function handleSaveName(filingId: number, e?: React.MouseEvent | React.FormEvent) {
    if (e) e.stopPropagation();
    const trimmed = editNameValue.trim();
    if (!trimmed) {
      setEditingFilingId(null);
      return;
    }
    setSavingEdit(true);
    try {
      await updateReturnName(filingId, trimmed);
      setEditingFilingId(null);
    } catch (err: any) {
      setGeneralError(err?.message || "Failed to update return name");
    } finally {
      setSavingEdit(false);
    }
  }

  function handleCancelEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setEditingFilingId(null);
    setEditNameValue("");
  }

  async function handleDeleteReturn(filingId: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this return workspace? All associated records will be removed.")) {
      return;
    }
    setDeletingId(filingId);
    try {
      await deleteFiling(filingId);
    } catch (err: any) {
      setGeneralError(err?.message || "Failed to delete return");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="minimal-card flex items-center justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <section className="minimal-card mb-8 p-6">
      {/* Header with Title and Add Return Button */}
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Return setup</p>
          <h2 className="mt-2 text-2xl font-black">Manage &amp; Select Tax Returns</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Add multiple returns for yourself or family members, customize their names, and select which return to work on. Only after selecting a return will subsequent intake steps unlock.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs shrink-0"
        >
          <Plus size={16} />
          <span>Add Return</span>
        </button>
      </div>

      {generalError && (
        <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-semibold text-destructive flex items-center justify-between">
          <span>{generalError}</span>
          <button onClick={() => setGeneralError("")} className="text-destructive hover:opacity-75">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Grid of Returns */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filings.map((filing) => {
          const profile = profiles.find((item) => item.id === filing.profile_id);
          const isSelected = activeFiling?.id === filing.id;
          const returnDisplayName =
            filing.progress_data?.return_name ||
            profile?.display_name ||
            `Return ${ayLabel(filing.assessment_year_start)}`;
          const isEditing = editingFilingId === filing.id;

          return (
            <div
              key={filing.id}
              onClick={() => void selectFiling(isSelected ? null : filing.id)}
              className={`group relative rounded-2xl border p-5 text-left cursor-pointer transition-all duration-200 ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                  : "border-border bg-card/60 hover:border-foreground/30 hover:bg-muted/30"
              }`}
            >
              {/* Header row of card: Name/Input + Action buttons */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <div
                      className="flex items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void handleSaveName(filing.id);
                          if (e.key === "Escape") handleCancelEdit(e as any);
                        }}
                        autoFocus
                        disabled={savingEdit}
                        className="w-full rounded-lg border border-primary bg-background px-2 py-1 text-sm font-bold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                        placeholder="Return Name"
                      />
                      <button
                        onClick={(e) => void handleSaveName(filing.id, e)}
                        disabled={savingEdit}
                        title="Save name"
                        className="rounded-lg bg-primary p-1.5 text-primary-foreground hover:bg-primary/90 transition-all"
                      >
                        {savingEdit ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={savingEdit}
                        title="Cancel"
                        className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted transition-all"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group/title">
                      <h3 className="font-black text-foreground truncate text-base" title={returnDisplayName}>
                        {returnDisplayName}
                      </h3>
                      <button
                        onClick={(e) => startEditing(filing.id, returnDisplayName, e)}
                        title="Edit return name"
                        className="opacity-0 group-hover:opacity-100 group-hover/title:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-opacity rounded-md hover:bg-muted"
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                  )}

                  {/* Year and Form info */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-foreground">
                      {ayLabel(filing.assessment_year_start)}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="rounded-md border border-border px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground bg-muted/30">
                      {filing.itr_form ?? "ITR-1"}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground text-[11px]">
                      {fyLabel(filing.assessment_year_start)}
                    </span>
                  </div>
                </div>

                {/* Selection Indicator & Delete */}
                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {isSelected ? (
                    <div
                      onClick={() => void selectFiling(null)}
                      title="Click to deselect"
                      className="flex items-center gap-1 text-primary cursor-pointer"
                    >
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase text-primary border border-primary/20">
                        Selected
                      </span>
                      <CheckCircle2 size={20} className="fill-primary/20 text-primary" />
                    </div>
                  ) : (
                    <button
                      onClick={() => void selectFiling(filing.id)}
                      title="Click to select this return"
                      className="text-muted-foreground/40 hover:text-foreground transition-colors p-1"
                    >
                      <Circle size={20} />
                    </button>
                  )}

                  {/* Delete option if more than 0 filings */}
                  <button
                    onClick={(e) => void handleDeleteReturn(filing.id, e)}
                    disabled={deletingId === filing.id}
                    title="Delete return workspace"
                    className="p-1 text-muted-foreground/30 hover:text-destructive transition-colors rounded-md hover:bg-destructive/10"
                  >
                    {deletingId === filing.id ? (
                      <Loader2 size={15} className="animate-spin text-destructive" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                  </button>
                </div>
              </div>

              {/* Progress Bar & Status */}
              <div className="mt-4 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                  <span>Intake completion</span>
                  <span className="font-bold">{filing.completion_percent}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${filing.completion_percent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {filings.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border p-8 text-center">
            <Calendar className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-bold text-foreground">No tax returns created yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Click &quot;Add Return&quot; above to create your first tax return for AY 2026-27 or a previous year.
            </p>
            <button
              onClick={openAddModal}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
            >
              <Plus size={14} />
              <span>Create First Return</span>
            </button>
          </div>
        )}
      </div>

      {/* Prompt / Notification Banner */}
      {filings.length > 0 && !activeFiling && (
        <div className="mt-5 flex items-center gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs font-semibold text-foreground">
          <AlertCircle size={17} className="text-amber-500 shrink-0" />
          <span>
            <strong>No return selected.</strong> Please click on any return card above to select it. The Next button will be enabled once a return is selected.
          </span>
        </div>
      )}

      {activeFiling && (
        <div className="mt-5 flex items-center gap-2.5 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs font-semibold text-foreground">
          <CheckCircle2 size={17} className="text-primary shrink-0" />
          <span>
            Active return:{" "}
            <strong>
              {activeFiling.progress_data?.return_name ||
                profiles.find((p) => p.id === activeFiling.profile_id)?.display_name ||
                `AY ${activeFiling.assessment_year_start}`}{" "}
              ({ayLabel(activeFiling.assessment_year_start)})
            </strong>
            . Next step is unlocked. Click &quot;Next&quot; in the header to proceed to Income Sources.
          </span>
        </div>
      )}

      {/* Add Return Dialog Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => !modalBusy && setShowAddModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-xl font-black text-foreground">Add New Tax Return</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure assessment year, taxpayer label, and filing form.
                </p>
              </div>
              <button
                onClick={() => !modalBusy && setShowAddModal(false)}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs font-semibold text-destructive flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddReturnSubmit} className="space-y-4">
              {/* Return Name Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Return Name / Taxpayer Label
                </label>
                <input
                  type="text"
                  value={newReturnName}
                  onChange={(e) => setNewReturnName(e.target.value)}
                  placeholder="e.g. Sri Charan - Primary, Priya - Spouse, Family HUF"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-hidden focus:ring-2 focus:ring-primary"
                  required
                />
                {/* Suggestions */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SUGGESTED_NAMES.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setNewReturnName(suggestion)}
                      className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assessment Year Select */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Assessment Year
                </label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {AY_OPTIONS.map((option) => (
                    <button
                      key={option.start}
                      type="button"
                      onClick={() => setNewAyStart(option.start)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        newAyStart === option.start
                          ? "border-primary bg-primary/10 font-bold text-foreground shadow-xs ring-1 ring-primary"
                          : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <p className="text-xs font-black">{ayLabel(option.start)}</p>
                      <p className="text-[10px] mt-0.5 opacity-80">{fyLabel(option.start)}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* ITR Form Options */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  ITR Form Selection
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {ITR_OPTIONS.map((form) => (
                    <button
                      key={form.id}
                      type="button"
                      onClick={() => setNewItrForm(form.id)}
                      className={`w-full rounded-xl border p-2.5 text-left transition-all ${
                        newItrForm === form.id
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                          : "border-border bg-muted/20 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-foreground">{form.label}</span>
                        {newItrForm === form.id && (
                          <CheckCircle2 size={14} className="text-primary" />
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground leading-tight">
                        {form.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={modalBusy}
                  className="rounded-full border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalBusy || !newReturnName.trim()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs disabled:opacity-50"
                >
                  {modalBusy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  <span>Create Return</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
