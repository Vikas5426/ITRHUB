"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Hexagon, Loader2, LockKeyhole } from "lucide-react";

import { useAuth } from "@/components/AuthProvider";
import { apiRequest } from "@/lib/api";

function AuthForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { refresh } = useAuth();
  const [mode, setMode] = useState(params.get("mode") === "signup" ? "signup" : "login");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    try {
      const payload =
        mode === "signup"
          ? {
              full_name: (data.get("full_name") as string)?.trim(),
              email: (data.get("email") as string)?.trim(),
              password: data.get("password") as string,
              phone_number: (data.get("phone_number") as string)?.trim(),
              occupation: (data.get("occupation") as string)?.trim(),
              address_line: (data.get("address_line") as string)?.trim(),
              city: (data.get("city") as string)?.trim(),
              state: (data.get("state") as string)?.trim(),
              pincode: (data.get("pincode") as string)?.trim(),
              gender: data.get("gender") as string,
              date_of_birth: data.get("date_of_birth") as string,
            }
          : {
              email: (data.get("email") as string)?.trim(),
              password: data.get("password") as string,
            };

      await apiRequest(`/api/auth/${mode === "signup" ? "register" : "login"}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await refresh();
      router.push("/intake");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to continue");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_24px_80px_rgba(0,0,0,0.08)] lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-black p-12 text-white lg:flex lg:flex-col justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.17),transparent_30%)]" />
          <Link href="/" className="relative flex items-center gap-2 text-xl font-black">
            <Hexagon fill="currentColor" />
            ITRHUB
          </Link>
          <div className="relative my-auto py-8">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-white/50">Your tax command center</p>
            <h1 className="max-w-md text-4xl font-black leading-[1.1] xl:text-5xl">
              One secure place for every return in your family.
            </h1>
            <div className="mt-8 space-y-4 text-sm font-medium text-white/75">
              {[
                "Separate profiles for family and HUF",
                "Assessment-year filing history & tracking",
                "Encrypted private document vault",
                "Automatic slab & regime optimization",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <p className="relative text-xs text-white/40">Your data is stored with Supabase encryption. Tax calculations adhere strictly to CBDT rules.</p>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12 overflow-y-auto max-h-[calc(100vh-4rem)]">
          <div className={`mx-auto w-full transition-all duration-200 ${mode === "signup" ? "max-w-xl" : "max-w-md"}`}>
            <Link href="/" className="mb-8 flex items-center gap-2 text-xl font-black lg:hidden">
              <Hexagon fill="currentColor" />
              ITRHUB
            </Link>
            <div className="mb-6">
              <div className="mb-5 inline-flex rounded-full bg-muted p-1">
                {(["login", "signup"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setMode(item);
                      setError("");
                    }}
                    className={`rounded-full px-5 py-2 text-sm font-bold transition ${mode === item ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {item === "login" ? "Log in" : "Create account"}
                  </button>
                ))}
              </div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "login"
                  ? "Continue your saved filing work."
                  : "Fill in your taxpayer details to set up your primary profile."}
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === "signup" ? (
                <>
                  {/* Account Information */}
                  <div className="space-y-3.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-1">
                      Account Credentials
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <label className="block text-sm font-semibold">
                        Full Name
                        <input
                          name="full_name"
                          required
                          minLength={2}
                          autoComplete="name"
                          placeholder="e.g. Rahul Sharma"
                          className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </label>
                      <label className="block text-sm font-semibold">
                        Email Address
                        <input
                          name="email"
                          required
                          type="email"
                          autoComplete="email"
                          placeholder="name@example.com"
                          className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </label>
                    </div>

                    <label className="block text-sm font-semibold">
                      Password
                      <input
                        name="password"
                        required
                        type="password"
                        minLength={10}
                        autoComplete="new-password"
                        placeholder="At least 10 characters with letter & number"
                        className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <span className="mt-1 block text-xs text-muted-foreground">Minimum 10 characters, including letters and numbers.</span>
                    </label>
                  </div>

                  {/* Personal Details */}
                  <div className="space-y-3.5 pt-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-1">
                      Personal & Contact Information
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <label className="block text-sm font-semibold">
                        Phone Number
                        <input
                          name="phone_number"
                          required
                          type="tel"
                          minLength={10}
                          maxLength={15}
                          autoComplete="tel"
                          placeholder="e.g. 9876543210"
                          className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </label>

                      <label className="block text-sm font-semibold">
                        Occupation
                        <input
                          name="occupation"
                          required
                          list="occupation-suggestions"
                          placeholder="e.g. Software Engineer, Business"
                          className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <datalist id="occupation-suggestions">
                          <option value="Salaried Employee" />
                          <option value="Software Professional" />
                          <option value="Business Owner / Trader" />
                          <option value="Professional (Doctor, CA, Lawyer)" />
                          <option value="Consultant / Freelancer" />
                          <option value="Civil Services / Government" />
                          <option value="Retired / Pensioner" />
                          <option value="Student" />
                        </datalist>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <label className="block text-sm font-semibold">
                        Gender
                        <select
                          name="gender"
                          required
                          defaultValue="male"
                          className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                      </label>

                      <label className="block text-sm font-semibold">
                        Date of Birth
                        <input
                          name="date_of_birth"
                          required
                          type="date"
                          max={new Date().toISOString().split("T")[0]}
                          className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Address Details */}
                  <div className="space-y-3.5 pt-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-1">
                      Residential Address
                    </div>
                    <label className="block text-sm font-semibold">
                      Address Line
                      <input
                        name="address_line"
                        required
                        minLength={3}
                        autoComplete="street-address"
                        placeholder="House / Flat No., Street, Area"
                        className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <label className="block text-sm font-semibold">
                        City
                        <input
                          name="city"
                          required
                          autoComplete="address-level2"
                          placeholder="e.g. Mumbai"
                          className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </label>

                      <label className="block text-sm font-semibold">
                        State
                        <input
                          name="state"
                          required
                          autoComplete="address-level1"
                          placeholder="e.g. Maharashtra"
                          className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </label>

                      <label className="block text-sm font-semibold">
                        PIN Code
                        <input
                          name="pincode"
                          required
                          maxLength={6}
                          pattern="[0-9]{6}"
                          inputMode="numeric"
                          placeholder="6-digit PIN"
                          className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </label>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <label className="block text-sm font-bold">
                    Email
                    <input
                      name="email"
                      required
                      type="email"
                      autoComplete="email"
                      placeholder="name@example.com"
                      className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3.5 font-medium outline-none focus:ring-2 focus:ring-ring/20"
                    />
                  </label>
                  <label className="block text-sm font-bold">
                    Password
                    <input
                      name="password"
                      required
                      type="password"
                      autoComplete="current-password"
                      className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3.5 font-medium outline-none focus:ring-2 focus:ring-ring/20"
                    />
                  </label>
                </>
              )}

              {error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm font-semibold text-destructive">
                  {error}
                </div>
              )}

              <button
                disabled={submitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                {mode === "login" ? "Log in securely" : "Complete Registration"}
              </button>
              <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground pt-1">
                <LockKeyhole size={13} />
                Secure session stored in an HTTP-only cookie
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
