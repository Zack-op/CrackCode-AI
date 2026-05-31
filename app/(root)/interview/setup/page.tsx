"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
type Level = "junior" | "mid" | "senior" | "lead";
type InterviewType = "technical" | "behavioral" | "mixed";
type Difficulty = "easy" | "medium" | "hard";
type QuestionCount = 3 | 5 | 7 | 10;

interface FormState {
  role: string;
  level: Level;
  type: InterviewType;
  techstack: string;
  difficulty: Difficulty;
  questionCount: QuestionCount;
}

// ─── Option Config ────────────────────────────────────────────────────────────
const LEVELS: { value: Level; label: string }[] = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
];

const TYPES: { value: InterviewType; label: string; description: string }[] = [
  { value: "technical", label: "Technical", description: "Coding, architecture, deep dives" },
  { value: "behavioral", label: "Behavioral", description: "Scenarios, teamwork, leadership" },
  { value: "mixed", label: "Mixed", description: "Balanced technical + behavioral" },
];

const DIFFICULTIES: { value: Difficulty; label: string; color: string }[] = [
  { value: "easy", label: "Easy", color: "text-green-400 border-green-400/40 bg-green-400/10" },
  { value: "medium", label: "Medium", color: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10" },
  { value: "hard", label: "Hard", color: "text-red-400 border-red-400/40 bg-red-400/10" },
];

const QUESTION_COUNTS: QuestionCount[] = [3, 5, 7, 10];

// ─── Component ────────────────────────────────────────────────────────────────
export default function SetupInterviewPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    role: "",
    level: "mid",
    type: "technical",
    techstack: "",
    difficulty: "medium",
    questionCount: 5,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const validate = (): string => {
    if (!form.role.trim()) return "Please enter the target job role.";
    if (!form.techstack.trim()) return "Please enter at least one technology.";
    return "";
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
  const validationError = validate();

  if (validationError) {
    setError(validationError);
    return;
  }

  setLoading(true);
  setError("");

  try {
    const userId =
      typeof window !== "undefined"
        ? localStorage.getItem("userId") ?? "anonymous"
        : "anonymous";

    // ── Convert comma-separated string → clean array ─────────────
    const parsedTechStack = form.techstack
      .split(",")
      .map((tech) => tech.trim())
      .filter(Boolean);

    const response = await fetch("/api/brain", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        mode: "generate_interview",

        role: form.role.trim(),
        level: form.level,
        type: form.type,

        // IMPORTANT
        techstack: parsedTechStack,

        difficulty: form.difficulty,
        amount: form.questionCount,

        userId,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Failed to generate interview."
      );
    }

    // ── Success → interview runtime ──────────────────────────────
    router.push(`/interview/${data.interviewId}`);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Something went wrong.";

    setError(message);
  } finally {
    setLoading(false);
  }
};

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className="container py-10 max-w-3xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold gradient-title">Setup Interview</h1>
        <p className="text-gray-400 mt-2">
          Configure your session and let AI generate a personalized interview.
        </p>
      </div>

      <div className="space-y-6">

        {/* ── Role ─────────────────────────────────────────────────────────── */}
        <div className="glass-card p-6 rounded-2xl space-y-3">
          <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Target Job Role
          </label>
          <input
            type="text"
            value={form.role}
            onChange={(e) => update("role", e.target.value)}
            placeholder="e.g. Frontend Engineer, Backend Developer, Full Stack..."
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition-colors"
          />
        </div>

        {/* ── Level ────────────────────────────────────────────────────────── */}
        <div className="glass-card p-6 rounded-2xl space-y-3">
          <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Experience Level
          </label>
          <div className="grid grid-cols-4 gap-3">
            {LEVELS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => update("level", value)}
                className={`py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                  form.level === value
                    ? "border-brand-400 bg-brand-400/20 text-white"
                    : "border-white/10 bg-white/5 text-gray-400 hover:border-white/30 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Interview Type ────────────────────────────────────────────────── */}
        <div className="glass-card p-6 rounded-2xl space-y-3">
          <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Interview Focus
          </label>
          <div className="grid grid-cols-3 gap-3">
            {TYPES.map(({ value, label, description }) => (
              <button
                key={value}
                onClick={() => update("type", value)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                  form.type === value
                    ? "border-brand-400 bg-brand-400/20"
                    : "border-white/10 bg-white/5 hover:border-white/30"
                }`}
              >
                <p className={`text-sm font-semibold ${form.type === value ? "text-white" : "text-gray-300"}`}>
                  {label}
                </p>
                <p className="text-xs text-gray-500 mt-1">{description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Tech Stack ───────────────────────────────────────────────────── */}
        <div className="glass-card p-6 rounded-2xl space-y-3">
          <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Tech Stack
          </label>
          <input
            type="text"
            value={form.techstack}
            onChange={(e) => update("techstack", e.target.value)}
            placeholder="e.g. React, TypeScript, Node.js, PostgreSQL..."
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition-colors"
          />
          <p className="text-xs text-gray-500">Separate technologies with commas</p>
        </div>

        {/* ── Difficulty ───────────────────────────────────────────────────── */}
        <div className="glass-card p-6 rounded-2xl space-y-3">
          <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Difficulty
          </label>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTIES.map(({ value, label, color }) => (
              <button
                key={value}
                onClick={() => update("difficulty", value)}
                className={`py-3 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                  form.difficulty === value
                    ? color
                    : "border-white/10 bg-white/5 text-gray-400 hover:border-white/30 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Question Count ───────────────────────────────────────────────── */}
        <div className="glass-card p-6 rounded-2xl space-y-3">
          <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Number of Questions
          </label>
          <div className="grid grid-cols-4 gap-3">
            {QUESTION_COUNTS.map((count) => (
              <button
                key={count}
                onClick={() => update("questionCount", count)}
                className={`py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                  form.questionCount === count
                    ? "border-brand-400 bg-brand-400/20 text-white"
                    : "border-white/10 bg-white/5 text-gray-400 hover:border-white/30 hover:text-white"
                }`}
              >
                {count}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Estimated duration: ~{form.questionCount * 3} minutes
          </p>
        </div>

        {/* ── Error ────────────────────────────────────────────────────────── */}
        {error && (
          <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* ── Summary + Submit ─────────────────────────────────────────────── */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Interview Summary
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-400">Role</span>
            <span className="text-white font-medium">{form.role || "—"}</span>
            <span className="text-gray-400">Level</span>
            <span className="text-white capitalize font-medium">{form.level}</span>
            <span className="text-gray-400">Focus</span>
            <span className="text-white capitalize font-medium">{form.type}</span>
            <span className="text-gray-400">Difficulty</span>
            <span className="text-white capitalize font-medium">{form.difficulty}</span>
            <span className="text-gray-400">Questions</span>
            <span className="text-white font-medium">{form.questionCount}</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating your interview...
              </span>
            ) : (
              "Generate Interview →"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
