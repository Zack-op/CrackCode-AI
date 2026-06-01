"use client";

import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";
import { auth } from "@/firebase/client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

import { signIn, signUp } from "@/lib/actions/auth.action";

// ─── Schema ───────────────────────────────────────────────────────────────────

const authFormSchema = (type: FormType) =>
  z.object({
    name:     type === "sign-up" ? z.string().min(3, "Name must be at least 3 characters") : z.string().optional(),
    email:    z.string().email("Enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

// ─── Input ────────────────────────────────────────────────────────────────────

function AuthInput({
  label,
  type,
  placeholder,
  error,
  ...rest
}: {
  label:       string;
  type:        string;
  placeholder: string;
  error?:      string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  const [showPw,  setShowPw ] = useState(false);

  const inputType = type === "password" && showPw ? "text" : type;

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold tracking-widest uppercase text-gray-400">
        {label}
      </label>

      <div
        className="relative rounded-xl overflow-hidden transition-all duration-300"
        style={{
          boxShadow: focused
            ? "0 0 0 1px rgba(34,211,238,0.6), 0 0 20px rgba(34,211,238,0.08)"
            : "0 0 0 1px rgba(255,255,255,0.08)",
        }}
      >
        <input
          {...rest}
          type={inputType}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder-gray-600 outline-none transition-colors duration-200 font-mono"
        />

        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPw((p) => !p)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors"
            tabIndex={-1}
          >
            {showPw ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const AuthForm = ({ type }: { type: FormType }) => {
  const router    = useRouter();
  const [loading, setLoading] = useState(false);
  const isSignIn  = type === "sign-in";

  const formSchema = authFormSchema(type);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver:      zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      if (type === "sign-up") {
        const { name, email, password } = data;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const result = await signUp({ uid: userCredential.user.uid, name: name!, email, password });
        if (!result.success) { toast.error(result.message); return; }
        toast.success("Account created. Please sign in.");
        router.push("/sign-in");
      } else {
        const { email, password } = data;
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();
        if (!idToken) { toast.error("Sign in failed. Please try again."); return; }
        await signIn({ email, idToken });
        toast.success("Signed in successfully.");
        router.push("/");
      }
    } catch (error: any) {
      const msg =
        error?.code === "auth/invalid-credential"   ? "Invalid email or password."        :
        error?.code === "auth/email-already-in-use" ? "This email is already registered." :
        error?.code === "auth/too-many-requests"    ? "Too many attempts. Try again later." :
        "Something went wrong. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-[480px]">

      {/* ── Ambient glow behind the card ──────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(34,211,238,0.18) 0%, transparent 70%)",
        }}
      />

      {/* ── Card ─────────────────────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background:    "rgba(10, 12, 18, 0.92)",
          backdropFilter: "blur(24px)",
          border:        "1px solid rgba(255,255,255,0.07)",
          boxShadow:     "0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Top cyan line */}
        <div
          className="h-px w-full"
          style={{ background: "linear-gradient(to right, transparent, rgba(34,211,238,0.5), transparent)" }}
        />

        <div className="px-10 py-12 space-y-8">

          {/* ── Branding ───────────────────────────────────────────────── */}
          <div className="space-y-1 text-center">
            {/* Logo mark */}
            <div className="flex justify-center mb-5">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(34,211,238,0.08)",
                  border:     "1px solid rgba(34,211,238,0.25)",
                  boxShadow:  "0 0 24px rgba(34,211,238,0.12)",
                }}
              >
                {/* Code bracket icon */}
                <svg className="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6"/>
                  <polyline points="8 6 2 12 8 18"/>
                </svg>
              </div>
            </div>

            <h1
              className="text-2xl font-bold tracking-tight text-white"
              style={{ fontFamily: "'DM Mono', 'Fira Code', monospace", letterSpacing: "-0.01em" }}
            >
              CrackCode<span className="text-cyan-400"> AI</span>
            </h1>
            <p className="text-xs tracking-widest uppercase text-gray-500 mt-1">
              Interview Intelligence Platform
            </p>
          </div>

          {/* ── Tab switcher ───────────────────────────────────────────── */}
          <div
            className="grid grid-cols-2 rounded-xl p-1 text-sm font-medium"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Link
              href="/sign-in"
              className={`py-2 rounded-lg text-center transition-all duration-200 ${
                isSignIn
                  ? "bg-cyan-500/15 text-cyan-400 shadow-sm"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className={`py-2 rounded-lg text-center transition-all duration-200 ${
                !isSignIn
                  ? "bg-cyan-500/15 text-cyan-400 shadow-sm"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Sign Up
            </Link>
          </div>

          {/* ── Form ───────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

            {!isSignIn && (
              <AuthInput
                label="Full Name"
                type="text"
                placeholder="Your name"
                error={errors.name?.message}
                {...register("name")}
              />
            )}

            <AuthInput
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email")}
            />

            <AuthInput
              label="Password"
              type="password"
              placeholder={isSignIn ? "Your password" : "Min 6 characters"}
              error={errors.password?.message}
              {...register("password")}
            />

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-3.5 rounded-xl text-sm font-semibold text-black transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden mt-2"
              style={{
                background: loading
                  ? "rgba(34,211,238,0.6)"
                  : "linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)",
                boxShadow: loading ? "none" : "0 0 24px rgba(34,211,238,0.3), 0 4px 12px rgba(0,0,0,0.4)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2.5">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  {isSignIn ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {isSignIn ? "Sign In" : "Create Account"}
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
            </button>
          </form>

          {/* ── Footer note ────────────────────────────────────────────── */}
          <p className="text-center text-xs text-gray-600">
            {isSignIn ? "Don't have an account? " : "Already have an account? "}
            <Link
              href={isSignIn ? "/sign-up" : "/sign-in"}
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              {isSignIn ? "Sign up free" : "Sign in"}
            </Link>
          </p>

        </div>

        {/* Bottom cyan line */}
        <div
          className="h-px w-full"
          style={{ background: "linear-gradient(to right, transparent, rgba(34,211,238,0.15), transparent)" }}
        />
      </div>
    </div>
  );
};  // ← this closing brace was missing in the original — root cause of the build error

export default AuthForm;
