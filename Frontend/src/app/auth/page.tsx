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
      await apiRequest(`/api/auth/${mode === "signup" ? "register" : "login"}`, {
        method: "POST",
        body: JSON.stringify({
          ...(mode === "signup" ? { full_name: data.get("full_name") } : {}),
          email: data.get("email"),
          password: data.get("password"),
        }),
      });
      await refresh();
      router.push("/workspace");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to continue");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_24px_80px_rgba(0,0,0,0.08)] lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-black p-12 text-white lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.17),transparent_30%)]" />
          <Link href="/" className="relative flex items-center gap-2 text-xl font-black">
            <Hexagon fill="currentColor" />
            ITRHUB
          </Link>
          <div className="relative my-auto">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-white/50">Your tax workspace</p>
            <h1 className="max-w-md text-5xl font-black leading-[1.05]">
              One secure place for every return in your family.
            </h1>
            <div className="mt-10 space-y-4 text-sm font-medium text-white/75">
              {["Separate profiles for family and HUF", "Assessment-year filing history", "Encrypted private document vault"].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-white" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <p className="relative text-xs text-white/40">Your password is hashed. Tax documents are encrypted before storage.</p>
        </div>

        <div className="flex items-center p-7 sm:p-12">
          <div className="mx-auto w-full max-w-md">
            <Link href="/" className="mb-12 flex items-center gap-2 text-xl font-black lg:hidden">
              <Hexagon fill="currentColor" />
              ITRHUB
            </Link>
            <div className="mb-8">
              <div className="mb-5 inline-flex rounded-full bg-muted p-1">
                {(["login", "signup"] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setMode(item);
                      setError("");
                    }}
                    className={`rounded-full px-5 py-2 text-sm font-bold transition ${mode === item ? "bg-background shadow-sm" : "text-muted-foreground"}`}
                  >
                    {item === "login" ? "Log in" : "Create account"}
                  </button>
                ))}
              </div>
              <h2 className="text-4xl font-black tracking-tight">
                {mode === "login" ? "Welcome back" : "Create your workspace"}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {mode === "login" ? "Continue your saved filing work." : "Your primary taxpayer profile is created automatically."}
              </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              {mode === "signup" && (
                <label className="block text-sm font-bold">
                  Full name
                  <input name="full_name" required minLength={2} autoComplete="name" className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3.5 font-medium outline-none focus:ring-2 focus:ring-ring/20" />
                </label>
              )}
              <label className="block text-sm font-bold">
                Email
                <input name="email" required type="email" autoComplete="email" className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3.5 font-medium outline-none focus:ring-2 focus:ring-ring/20" />
              </label>
              <label className="block text-sm font-bold">
                Password
                <input name="password" required type="password" minLength={mode === "signup" ? 10 : undefined} autoComplete={mode === "signup" ? "new-password" : "current-password"} className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3.5 font-medium outline-none focus:ring-2 focus:ring-ring/20" />
                {mode === "signup" && <span className="mt-2 block text-xs font-medium text-muted-foreground">At least 10 characters with a letter and number.</span>}
              </label>

              {error && <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm font-semibold text-destructive">{error}</div>}

              <button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                {mode === "login" ? "Log in securely" : "Create secure workspace"}
              </button>
              <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                <LockKeyhole size={13} />
                Session stored in an HTTP-only cookie
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
