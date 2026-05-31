import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { interviewCovers } from "@/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const getTechLogos = async (
  techStack: string[]
) => {
  return techStack.map((tech) => ({
    tech,
    url: `/tech/${tech.toLowerCase()}.svg`,
  }));
};
export function getRandomInterviewCover(): string {
  if (!interviewCovers || interviewCovers.length === 0) {
    return "/covers/default.png";
  }

  const randomIndex = Math.floor(Math.random() * interviewCovers.length);

  return interviewCovers[randomIndex];
}


export function getScoreColor(score: number): string {
  if (score >= 80) return "text-success-400";
  if (score >= 65) return "text-brand-400";
  if (score >= 50) return "text-warning-400";
  return "text-danger-400";
}

export function getScoreBg(score: number): string {
  if (score >= 80) return "bg-success-400/10 border-success-400/30";
  if (score >= 65) return "bg-brand-400/10 border-brand-400/30";
  if (score >= 50) return "bg-warning-400/10 border-warning-400/30";
  return "bg-danger-400/10 border-danger-400/30";
}

export function getHiringBadgeClass(
  recommendation: string
): string {
  const map: Record<string, string> = {
    "Strong Hire": "hire-strong",
    Hire: "hire-good",
    Hold: "hire-hold",
    Reject: "hire-reject",
  };
  return map[recommendation] ?? "hire-hold";
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function getModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    technical: "Technical",
    hr: "HR",
    behavioral: "Behavioral",
    dsa: "DSA",
    systemDesign: "System Design",
    resume: "Resume",
    company: "Company-Specific",
  };
  return labels[mode] ?? mode;
}

export function getModeAccent(mode: string): string {
  const accents: Record<string, string> = {
    technical: "#38BDF8",
    hr: "#34D399",
    behavioral: "#A78BFA",
    dsa: "#FBBF24",
    systemDesign: "#FB7185",
    resume: "#818CF8",
    company: "#86EFAC",
  };
  return accents[mode] ?? "#5C8EFF";
}
