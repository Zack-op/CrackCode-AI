"use client";

import { useEffect, useRef, useState } from "react";

interface TimerProps {
  isRunning: boolean;
}

export default function Timer({ isRunning }: TimerProps) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      // Reset to 0 every time a new interview starts
      setSeconds(0);

      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      // Stop counting when interview ends or hasn't started
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <div
      className={`glass-card px-4 py-2 rounded-xl font-mono font-semibold text-sm transition-colors duration-300 ${
        isRunning ? "text-green-400" : "text-gray-500"
      }`}
    >
      {isRunning ? (
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          {display}
        </span>
      ) : (
        <span className="text-gray-500">00:00</span>
      )}
    </div>
  );
}
