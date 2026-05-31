"use client";

import { useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface TranscriptProps {
  messages: Message[];
}

// ─── Role Config ──────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  assistant: {
    label: "AI",
    labelClass: "text-blue-400 bg-blue-400/10 border border-blue-400/20",
    contentClass: "text-gray-200",
    bubbleClass: "bg-white/5",
  },
  user: {
    label: "You",
    labelClass: "text-cyan-400 bg-cyan-400/10 border border-cyan-400/20",
    contentClass: "text-gray-100",
    bubbleClass: "bg-white/[0.03]",
  },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────
export default function Transcript({ messages }: TranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  // Filter out system messages — they should never be shown to the user
  const visibleMessages = messages.filter((m) => m.role !== "system");

  return (
    <div
      ref={containerRef}
      className="glass-card rounded-2xl p-4 h-64 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Live Transcript
        </h2>
        {visibleMessages.length > 0 && (
          <span className="text-xs text-gray-500">
            {visibleMessages.length} message{visibleMessages.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
        {visibleMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-gray-600 text-center">
              Interview transcript will appear here...
            </p>
          </div>
        ) : (
          visibleMessages.map((message, index) => {
            const config = ROLE_CONFIG[message.role];
            return (
              <div
                key={index}
                className={`rounded-xl p-3 ${config.bubbleClass}`}
              >
                <div className="flex items-start gap-2">
                  {/* Role badge */}
                  <span
                    className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-md ${config.labelClass}`}
                  >
                    {config.label}
                  </span>
                  {/* Message content */}
                  <p className={`text-sm leading-relaxed ${config.contentClass}`}>
                    {message.content}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
