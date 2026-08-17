"use client";

import { useState, useMemo, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Fingerprint,
  Globe,
  KeyRound,
  Landmark,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Receipt,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  User,
  UserCheck,
  UserCog,
  UserRound,
  WalletCards,
  Wrench,
} from "lucide-react";

import { useAuth } from "@/components/AuthProvider";
import { useTaxWorkspace } from "@/context/TaxWorkspaceContext";
import { apiRequest } from "@/lib/api";

type TabId = "overview" | "personal" | "tax" | "financial" | "documents" | "security";

export function ProfileCommandCenter() {
  const router = useRouter();
  const { user, updateProfile, refresh, logout } = useAuth();
  const { incomeSources, deductions, taxAnalysis, documents } = useTaxWorkspace();

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Personal form state
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [bio, setBio] = useState(
    user?.bio ||
      "Taxpayer on ITRHUB preparing AY 2026-27 individual tax return with unified salary, investments, and deduction claims."
  );
  const [occupation, setOccupation] = useState(user?.occupation || "Salaried Professional");
  const [addressLine, setAddressLine] = useState(user?.address_line || "");
  const [city, setCity] = useState(user?.city || "Bengaluru");
  const [state, setState] = useState(user?.state || "Karnataka");
  const [pincode, setPincode] = useState(user?.pincode || "560001");
  const [gender, setGender] = useState(user?.gender || "Not specified");
  const [dob, setDob] = useState(user?.date_of_birth ? String(user.date_of_birth) : "1994-05-15");

  // Tax form state
  const [pan, setPan] = useState("");
  const [aadhaarLastFour, setAadhaarLastFour] = useState(user?.aadhaar_masked?.slice(-4) || "7890");
  const [residencyStatus, setResidencyStatus] = useState(user?.residency_status || "resident");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Delete account state
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Financial aggregates
  const grossSalary = incomeSources?.salary?.enabled ? Number(incomeSources.salary.gross_salary || 0) : 0;
  const tdsDeposited = incomeSources?.salary?.enabled ? Number(incomeSources.salary.tds || 0) : 0;
  const capitalGains = incomeSources?.capital_gains?.enabled
    ? Number(incomeSources.capital_gains.listed_equity_stcg || 0) +
      Number(incomeSources.capital_gains.listed_equity_ltcg || 0) +
      Number(incomeSources.capital_gains.property_gains || 0)
    : 0;
  const sec80c = deductions?.sec_80c || 0;
  const sec80d = (deductions?.sec_80d_self || 0) + (deductions?.sec_80d_parents || 0);
  const totalDeductions = sec80c + sec80d + (deductions?.sec_80ccd_1b || 0) + (deductions?.hra_exemption || 0) + (deductions?.sec_24b_home_loan || 0);

  const newTax = taxAnalysis?.new_regime?.tax_after_cess ?? 0;
  const oldTax = taxAnalysis?.old_regime?.tax_after_cess ?? 0;

  // Handle personal & tax profile save
  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");
    setSubmitting(true);

    try {
      await updateProfile({
        full_name: fullName,
        phone_number: phone,
        bio,
        occupation,
        address_line: addressLine,
        city,
        state,
        pincode,
        gender,
        date_of_birth: dob ? dob : null,
        ...(pan ? { pan } : {}),
        aadhaar_last_four: aadhaarLastFour,
        residency_status: residencyStatus,
      });
      setSuccessMsg("Profile details saved and synchronized across ITRHUB.");
      setIsEditing(false);
      await refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle change password
  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordSuccess("");
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 10) {
      setPasswordError("Password must be at least 10 characters.");
      return;
    }

    setPasswordSubmitting(true);
    try {
      await apiRequest("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      setPasswordSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setPasswordSubmitting(false);
    }
  };

  // Handle delete account
  const handleDeleteAccount = async (e: FormEvent) => {
    e.preventDefault();
    setDeleteError("");
    setDeleteSubmitting(true);

    try {
      await apiRequest("/api/auth/delete-account", {
        method: "POST",
        body: JSON.stringify({
          password: deletePassword,
          confirmation_text: deleteConfirmText,
        }),
      });
      await logout();
      router.push("/");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Account deletion failed.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl py-20 px-6 text-center">
        <div className="rounded-3xl border border-border bg-card p-12 shadow-sm">
          <Lock size={48} className="mx-auto text-primary mb-4" />
          <h2 className="text-3xl font-black text-foreground">Sign In to Access Your Profile</h2>
          <p className="mt-2 text-muted-foreground">Manage your identity, tax info, and connected workspace.</p>
          <Link
            href="/auth?mode=login"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-black text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
          >
            <span>Log In</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  const initialLetter = user.full_name ? user.full_name.charAt(0).toUpperCase() : "U";

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Banner Message */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-xs font-bold text-green-700 dark:text-green-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* --- Airbnb-Inspired Profile Hero Card Grid --- */}
      <div className="grid gap-8 lg:grid-cols-[360px_1fr] items-start">
        {/* Left Card: Airbnb-style Avatar & Verification Card */}
        <div className="rounded-[2.5rem] border border-border bg-card p-8 shadow-md flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[70px] rounded-full pointer-events-none" />

          {/* User Avatar with Badge */}
          <div className="relative mb-5 group">
            <div className="size-32 rounded-full bg-gradient-to-tr from-primary/30 via-primary/10 to-muted border-4 border-background shadow-lg flex items-center justify-center text-5xl font-black text-primary overflow-hidden">
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt={user.full_name} className="size-full object-cover" />
              ) : (
                <span>{initialLetter}</span>
              )}
            </div>
            {/* Verified Badge Icon */}
            <div className="absolute bottom-1 right-1 rounded-full bg-primary p-2 text-primary-foreground shadow-md border-2 border-background">
              <ShieldCheck size={18} />
            </div>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-foreground">{user.full_name}</h2>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <BadgeCheck size={14} className="text-primary" />
            <span>Primary Taxpayer • AY 2026-27</span>
          </div>

          {/* 3 Quick Stat Columns (Airbnb style: reviews, rating, hosting) */}
          <div className="mt-8 grid grid-cols-3 w-full border-y border-border py-4 text-center">
            <div className="px-1 border-r border-border">
              <span className="block text-xl font-black text-foreground">{documents.length || 0}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vault Docs</span>
            </div>
            <div className="px-1 border-r border-border">
              <div className="flex items-center justify-center gap-0.5 text-xl font-black text-foreground">
                <span>98%</span>
                <Sparkles size={12} className="text-primary fill-primary" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Readiness</span>
            </div>
            <div className="px-1">
              <span className="block text-xl font-black text-foreground">2026</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Filing AY</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 w-full space-y-2">
            <button
              onClick={() => {
                setActiveTab("personal");
                setIsEditing(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
            >
              <UserCog size={14} />
              <span>Edit Taxpayer Profile</span>
            </button>
            <Link
              href="/intake"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-border py-3 text-xs font-bold text-foreground hover:bg-muted transition-all"
            >
              <span>Open Filing Intake</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Right Section: "About [Name]" & Structured Info (Airbnb layout) */}
        <div className="space-y-6">
          <div className="rounded-[2.5rem] border border-border bg-card p-8 shadow-xs space-y-6">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Taxpayer Profile</span>
              <h1 className="text-3xl font-black text-foreground mt-1">About {user.full_name}</h1>
            </div>

            {/* Metadata Icon Chips (Airbnb inspired) */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3.5 text-sm">
                <div className="rounded-xl bg-muted/60 p-2.5 text-primary">
                  <Building2 size={18} />
                </div>
                <div>
                  <span className="block text-[11px] font-bold uppercase text-muted-foreground">My work</span>
                  <span className="font-bold text-foreground">{user.occupation || occupation}</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 text-sm">
                <div className="rounded-xl bg-muted/60 p-2.5 text-primary">
                  <MapPin size={18} />
                </div>
                <div>
                  <span className="block text-[11px] font-bold uppercase text-muted-foreground">Lives in</span>
                  <span className="font-bold text-foreground">
                    {user.city ? `${user.city}, ${user.state || "India"}` : `${city}, ${state}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 text-sm">
                <div className="rounded-xl bg-muted/60 p-2.5 text-primary">
                  <Globe size={18} />
                </div>
                <div>
                  <span className="block text-[11px] font-bold uppercase text-muted-foreground">Tax Residency</span>
                  <span className="font-bold text-foreground">
                    {user.residency_status === "resident" ? "Resident & Ordinarily Resident" : "Non-Resident (NRI)"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 text-sm">
                <div className="rounded-xl bg-muted/60 p-2.5 text-primary">
                  <Fingerprint size={18} />
                </div>
                <div>
                  <span className="block text-[11px] font-bold uppercase text-muted-foreground">Identity Verified</span>
                  <span className="font-bold text-foreground">
                    {user.pan_masked ? `PAN ${user.pan_masked}` : "PAN Validated in Return"}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio summary paragraph */}
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                {user.bio || bio}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- Tab Navigation --- */}
      <div className="border-b border-border flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "overview" as const, label: "Overview", icon: UserRound },
          { id: "personal" as const, label: "Personal Information", icon: User },
          { id: "tax" as const, label: "Tax & Identity", icon: Fingerprint },
          { id: "financial" as const, label: "Financial Snapshot", icon: WalletCards },
          { id: "documents" as const, label: "Document Vault", icon: FileText },
          { id: "security" as const, label: "Security & Login", icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-black transition-all shrink-0 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- TAB CONTENT PANELS --- */}

      {/* 1. Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Receipt size={20} />
              </div>
              <h3 className="font-black text-lg text-foreground">Active Tax Return</h3>
              <p className="mt-1 text-xs text-muted-foreground">AY 2026-27 (FY 2025-26)</p>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-muted-foreground">ITR Form:</span>
                  <span className="text-foreground">ITR-1 / ITR-2</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-muted-foreground">Gross Income:</span>
                  <span className="text-foreground">₹{(grossSalary + capitalGains).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-muted-foreground">TDS Deposited:</span>
                  <span className="text-green-600 dark:text-green-400">₹{tdsDeposited.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
            <Link
              href="/analysis"
              className="mt-6 flex items-center justify-center gap-2 rounded-full bg-primary/10 py-2.5 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <span>View Tax Analysis</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <FileCheck2 size={20} />
              </div>
              <h3 className="font-black text-lg text-foreground">Verified Documents</h3>
              <p className="mt-1 text-xs text-muted-foreground">256-bit Encrypted Private Storage</p>
              <div className="mt-4 space-y-2 text-xs font-bold">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Files:</span>
                  <span className="text-foreground">{documents.length} Uploaded</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reconciliation:</span>
                  <span className="text-green-600 dark:text-green-400">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AI Ingestion:</span>
                  <span className="text-foreground">Enabled</span>
                </div>
              </div>
            </div>
            <Link
              href="/intake?section=documents"
              className="mt-6 flex items-center justify-center gap-2 rounded-full bg-primary/10 py-2.5 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <span>Manage Documents</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <TrendingUp size={20} />
              </div>
              <h3 className="font-black text-lg text-foreground">Regime Recommendation</h3>
              <p className="mt-1 text-xs text-muted-foreground">Statutory Section 115BAC Engine</p>
              <div className="mt-4 space-y-2 text-xs font-bold">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Regime Tax:</span>
                  <span className="text-foreground">₹{newTax.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Old Regime Tax:</span>
                  <span className="text-foreground">₹{oldTax.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Optimal Choice:</span>
                  <span className="text-primary font-black uppercase">
                    {newTax <= oldTax ? "New Regime" : "Old Regime"}
                  </span>
                </div>
              </div>
            </div>
            <Link
              href="/analysis"
              className="mt-6 flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
            >
              <span>Regime Breakdown</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}

      {/* 2. Personal Information Tab */}
      {activeTab === "personal" && (
        <form onSubmit={handleProfileSave} className="rounded-3xl border border-border bg-card p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="text-xl font-black text-foreground">Personal Information</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Update your primary profile details. Changes immediately synchronize across all workbenches.
              </p>
            </div>
            {errorMsg && <span className="text-xs font-bold text-destructive">{errorMsg}</span>}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Full Legal Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Email Address (Account ID)
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full rounded-2xl border border-input bg-muted/50 px-4 py-3 text-sm font-bold text-muted-foreground cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Occupation / Profession
              </label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Salaried Tech Professional, Consultant"
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Not specified">Prefer not to say</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Residential Address
              </label>
              <input
                type="text"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="Flat / House No., Street, Area"
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                State & PIN Code
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State"
                  className="rounded-2xl border border-input bg-background px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  value={pincode}
                  maxLength={6}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="PIN"
                  className="rounded-2xl border border-input bg-background px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Taxpayer Bio Summary
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-input bg-background p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              <span>Save Personal Information</span>
            </button>
          </div>
        </form>
      )}

      {/* 3. Tax & Identity Tab */}
      {activeTab === "tax" && (
        <form onSubmit={handleProfileSave} className="rounded-3xl border border-border bg-card p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="text-xl font-black text-foreground">Tax & Statutory Identity</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permanent Account Number (PAN), residential status, and statutory tax parameters.
              </p>
            </div>
            {errorMsg && <span className="text-xs font-bold text-destructive">{errorMsg}</span>}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Permanent Account Number (PAN)
              </label>
              <input
                type="text"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                placeholder={user.pan_masked || "ABCDE1234F"}
                maxLength={10}
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm font-mono font-bold tracking-wider uppercase outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="mt-1.5 block text-[11px] text-muted-foreground font-medium">
                Standard 10-character alphanumeric PAN issued by the Income Tax Department.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Aadhaar (Last 4 Digits)
              </label>
              <input
                type="text"
                value={aadhaarLastFour}
                onChange={(e) => setAadhaarLastFour(e.target.value)}
                maxLength={4}
                placeholder="7890"
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm font-mono font-bold tracking-wider outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="mt-1.5 block text-[11px] text-muted-foreground font-medium">
                For PAN-Aadhaar linkage confirmation during e-verification.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Residential Status
              </label>
              <select
                value={residencyStatus}
                onChange={(e) => setResidencyStatus(e.target.value)}
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="resident">Resident & Ordinarily Resident (ROR)</option>
                <option value="rnor">Resident but Not Ordinarily Resident (RNOR)</option>
                <option value="nri">Non-Resident Indian (NRI)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Filing Entity Type
              </label>
              <input
                type="text"
                value="Individual (Salaried / Self-Employed)"
                disabled
                className="w-full rounded-2xl border border-input bg-muted/50 px-4 py-3 text-sm font-bold text-muted-foreground cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              <span>Update Tax Identity</span>
            </button>
          </div>
        </form>
      )}

      {/* 4. Financial Snapshot Tab */}
      {activeTab === "financial" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
              <div>
                <h3 className="text-xl font-black text-foreground">Canonical Financial Profile</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Synchronized real-time with your active filing workspace. Enter once in Intake, review here.
                </p>
              </div>
              <Link
                href="/intake?section=income"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <span>Edit Income Streams</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <span className="text-xs font-bold text-muted-foreground uppercase">Gross Salary</span>
                <p className="text-2xl font-black text-foreground mt-1">₹{grossSalary.toLocaleString("en-IN")}</p>
                <span className="text-[11px] text-muted-foreground font-medium">From Form 16 / Intake</span>
              </div>

              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <span className="text-xs font-bold text-muted-foreground uppercase">Capital Gains</span>
                <p className="text-2xl font-black text-foreground mt-1">₹{capitalGains.toLocaleString("en-IN")}</p>
                <span className="text-[11px] text-muted-foreground font-medium">Sec 111A / 112A Equities</span>
              </div>

              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <span className="text-xs font-bold text-muted-foreground uppercase">Deductions Claimed</span>
                <p className="text-2xl font-black text-foreground mt-1">₹{totalDeductions.toLocaleString("en-IN")}</p>
                <span className="text-[11px] text-muted-foreground font-medium">80C, 80D, NPS & HRA</span>
              </div>

              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <span className="text-xs font-bold text-muted-foreground uppercase">TDS Deposited</span>
                <p className="text-2xl font-black text-green-600 dark:text-green-400 mt-1">₹{tdsDeposited.toLocaleString("en-IN")}</p>
                <span className="text-[11px] text-muted-foreground font-medium">Tax Credits in 26AS</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Document Vault Tab */}
      {activeTab === "documents" && (
        <div className="rounded-3xl border border-border bg-card p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="text-xl font-black text-foreground">Encrypted Document Evidence</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                All tax documents are AES-256 encrypted and accessible only to your account.
              </p>
            </div>
            <Link
              href="/intake?section=documents"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
            >
              <span>Upload New Document</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {documents.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <FileText size={36} className="mx-auto mb-2 opacity-50" />
              <p className="font-bold text-sm">No documents in vault yet.</p>
              <p className="text-xs mt-1">Upload Form 16, AIS/TIS, or broker P&L to auto-extract your tax facts.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-foreground truncate max-w-[200px]">{doc.original_name}</h4>
                      <span className="text-[11px] text-muted-foreground uppercase font-bold">{doc.category}</span>
                    </div>
                  </div>
                  <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-[10px] font-black text-green-700 dark:text-green-400 border border-green-500/20">
                    Encrypted
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Security & Password Tab */}
      {activeTab === "security" && (
        <div className="space-y-8">
          {/* Change Password Card */}
          <form onSubmit={handlePasswordChange} className="rounded-3xl border border-border bg-card p-8 shadow-xs space-y-6">
            <div className="border-b border-border pb-4">
              <h3 className="text-xl font-black text-foreground">Change Password</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Passwords must contain at least 10 characters, including letters and numbers.
              </p>
            </div>

            {passwordSuccess && (
              <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-xs font-bold text-green-700 dark:text-green-300">
                {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-bold text-destructive">
                {passwordError}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={10}
                  className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={10}
                  className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <button
                type="submit"
                disabled={passwordSubmitting}
                className="flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
              >
                {passwordSubmitting ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                <span>Update Password</span>
              </button>
            </div>
          </form>

          {/* Account Deletion Danger Zone */}
          <form onSubmit={handleDeleteAccount} className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 shadow-xs space-y-6">
            <div className="border-b border-destructive/20 pb-4">
              <div className="flex items-center gap-2 text-destructive font-black">
                <ShieldAlert size={20} />
                <h3 className="text-xl">Danger Zone: Delete Account</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Permanently deletes your account, taxpayer profile, uploaded tax documents, and all calculation records.
              </p>
            </div>

            {deleteError && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-bold text-destructive">
                {deleteError}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-destructive uppercase tracking-wider mb-2">
                  Type &quot;DELETE&quot; to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  required
                  className="w-full rounded-2xl border border-destructive/30 bg-background px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-destructive"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-destructive uppercase tracking-wider mb-2">
                  Verify Your Password
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-destructive/30 bg-background px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-destructive"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-destructive/20">
              <button
                type="submit"
                disabled={deleteSubmitting || deleteConfirmText.trim() !== "DELETE"}
                className="flex items-center gap-2 rounded-full bg-destructive px-8 py-3.5 text-xs font-black text-destructive-foreground hover:bg-destructive/90 transition-all shadow-md disabled:opacity-40"
              >
                {deleteSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                <span>Permanently Delete Account</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
