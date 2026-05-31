// components/DisplayTechIcons.tsx
// Emoji-based tech icons — no SVG files required, zero 404 errors

import { cn } from "@/lib/utils";

const TECH_ICONS: Record<string, string> = {
  javascript: "🟨", typescript: "🔷", python: "🐍", java: "☕",
  "c++": "⚙️", "c#": "💜", go: "🔵", rust: "🦀", swift: "🍊",
  kotlin: "🟣", php: "🐘", ruby: "💎",
  react: "⚛️", "next.js": "▲", nextjs: "▲", vue: "💚", angular: "🔴",
  svelte: "🔥", tailwind: "🌊", css: "🎨", html: "📄",
  node: "💚", nodejs: "💚", "node.js": "💚", fastapi: "⚡",
  django: "🟢", flask: "🧪", express: "🚂", spring: "🍃",
  postgresql: "🐘", postgres: "🐘", mysql: "🐬", mongodb: "🍃",
  redis: "🔴", sqlite: "📦", firestore: "🔥", firebase: "🔥", supabase: "⚡",
  aws: "☁️", gcp: "🌐", azure: "🔵", docker: "🐳", kubernetes: "⎈",
  github: "⚫", git: "🔀", linux: "🐧",
  tensorflow: "🧠", pytorch: "🔥", ml: "🤖", ai: "🧠", openai: "🟢", gemini: "✨",
  "react native": "📱", flutter: "💙", android: "🤖", ios: "🍎",
  graphql: "🔗", rest: "🌐", api: "🔌", "machine learning": "🤖",
  microservices: "🧩", agile: "🔄", figma: "🎨",
};

function getTechEmoji(tech: string): string {
  const key = tech.toLowerCase().trim();
  if (TECH_ICONS[key]) return TECH_ICONS[key];
  for (const [name, emoji] of Object.entries(TECH_ICONS)) {
    if (key.includes(name) || name.includes(key)) return emoji;
  }
  const defaults = ["⚡", "🔧", "📦", "🛠️", "💻", "🔩", "🎯"];
  return defaults[tech.charCodeAt(0) % defaults.length];
}

interface TechIconProps {
  techStack: string[];
  maxVisible?: number;
  size?: "sm" | "md" | "lg";
}

const DisplayTechIcons = ({ techStack, maxVisible = 4, size = "md" }: TechIconProps) => {
  if (!techStack || !Array.isArray(techStack) || techStack.length === 0) return null;

  const visible = techStack.slice(0, maxVisible);
  const overflow = techStack.length - maxVisible;

  const sizeClasses = { sm: "w-7 h-7 text-sm", md: "w-8 h-8 text-base", lg: "w-10 h-10 text-lg" };

  return (
    <div className="flex items-center gap-1">
      {visible.map((tech, index) => (
        <div key={tech} className="group relative" title={tech}>
          <div className={cn(
            "flex items-center justify-center rounded-xl bg-white/5 border border-white/10",
            "hover:bg-white/10 hover:border-white/20 transition-all duration-200",
            sizeClasses[size], index > 0 && "-ml-1"
          )}>
            <span>{getTechEmoji(tech)}</span>
          </div>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {tech}
          </div>
        </div>
      ))}
      {overflow > 0 && (
        <div className={cn(
          "flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-xs text-gray-500 font-medium -ml-1",
          sizeClasses[size]
        )}>
          +{overflow}
        </div>
      )}
    </div>
  );
};

export default DisplayTechIcons;
