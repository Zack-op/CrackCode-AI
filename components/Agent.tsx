"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createFeedback} from "@/lib/actions/general.action";
import Waveform from "@/components/ai/Waveform";
import Timer from "@/components/ai/Timer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role:    "interviewer" | "candidate";
  content: string;
}

interface AgentProps {
  userName:         string;
  userId:           string;
  interviewId:      string;
  feedbackId?:      string;
  interviewRole:    string;
  interviewLevel:   string;
  interviewType:    string;
  techStack:        string[];
  difficulty:       string;
  initialQuestions: string[];
}

type InterviewPhase =
  | "idle"       // not started
  | "speaking"   // AI TTS active
  | "listening"  // user answering
  | "thinking"   // brain API call in flight
  | "finished";  // interview over, generating feedback

// ─── Intensity bar colours ─────────────────────────────────────────────────────

function intensityGradient(score: number) {
  // green → yellow → orange → red across 0-100
  if (score < 40)  return "bg-green-500";
  if (score < 60)  return "bg-yellow-400";
  if (score < 80)  return "bg-orange-400";
  return "bg-red-500";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Agent({
  userName,
  userId,
  interviewId,
  feedbackId,
  interviewRole,
  interviewLevel,
  interviewType,
  techStack,
  difficulty,
  initialQuestions,
}: AgentProps) {
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [phase,       setPhase      ] = useState<InterviewPhase>("idle");
  const [messages,    setMessages   ] = useState<Message[]>([]);
  const [transcript,  setTranscript ] = useState("");
  const [statusText,  setStatusText ] = useState("Click Start Interview to begin");
  const [candidateState, setCandidateState] = useState({
    currentDifficulty:        5,
    topicsCovered:            [] as string[],
    averageScore:             50,
    consecutiveStrongAnswers: 0,
    consecutiveWeakAnswers:   0,
    mood:                     "neutral",
    turnCount:                0,
  });

  const convEndRef = useRef<HTMLDivElement | null>(null);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const recognitionRef = useRef<any>(null);
  const messagesRef    = useRef<Message[]>([]);
  const transcriptRef  = useRef<string>("");

  useEffect(() => { messagesRef.current   = messages;   }, [messages]);
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

  // Auto-scroll conversation
  useEffect(() => {
    convEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, transcript]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const isIdle      = phase === "idle";
  const isListening = phase === "listening";
  const isSpeaking  = phase === "speaking";
  const isThinking  = phase === "thinking";
  const isFinished  = phase === "finished";
  const isActive    = !isIdle && !isFinished;

  const candidateTurns = messages.filter((m) => m.role === "candidate").length;
  const totalTurns     = initialQuestions.length;
  const intensity      = candidateState.currentDifficulty * 10; // 0-100

  // ─── TTS ──────────────────────────────────────────────────────────────────

  const speak = (text: string, onDone?: () => void) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      onDone?.();
      return;
    }

    window.speechSynthesis.cancel();
    setPhase("speaking");
    setStatusText("Alex is speaking...");

    const utterance  = new SpeechSynthesisUtterance(text);
    utterance.rate   = 0.92;
    utterance.pitch  = 1.0;
    utterance.volume = 1.0;

    const voices    = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) =>
      v.name.includes("Google UK English Female") ||
      v.name.includes("Samantha") ||
      v.name.includes("Karen")    ||
      v.name.includes("Moira")
    ) ?? voices.find((v) => v.lang.startsWith("en")) ?? null;

    if (preferred) utterance.voice = preferred;

    utterance.onend   = () => { onDone?.(); };
    utterance.onerror = () => { onDone?.(); };

    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () =>
        window.speechSynthesis.speak(utterance);
    } else {
      window.speechSynthesis.speak(utterance);
    }
  };

  // ─── Speech Recognition setup ─────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) return;

    const recognition          = new SR();
    recognition.continuous     = true;
    recognition.interimResults = true;
    recognition.lang           = "en-US";

    recognition.onresult = (event: any) => {
      let final   = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + " ";
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript(final + interim);
    };

    recognition.onerror = () => setPhase("listening");
    recognitionRef.current = recognition;
  }, []);

  // ─── Start interview ───────────────────────────────────────────────────────

  const handleStart = () => {
    if (!initialQuestions?.length) return;

    const opening = `Hi ${userName}! I'm Alex, your interviewer today. Let's get started. ${initialQuestions[0]}`;
    const firstMessage: Message = {
      role:    "interviewer",
      content: initialQuestions[0],
    };

    setMessages([firstMessage]);
    speak(opening, () => {
      setPhase("listening");
      setStatusText("Your turn — click Start Answer when ready");
    });
  };

  // ─── Start listening ───────────────────────────────────────────────────────

  const startListening = () => {
    if (phase !== "listening") return;

    setTranscript("");
    transcriptRef.current = "";
    setStatusText("Listening — speak your answer, then click Stop Answer");

    try {
      recognitionRef.current?.start();
    } catch {
      // already started — ignore
    }
  };

  // ─── Stop listening → send to brain ───────────────────────────────────────

  const stopListening = async () => {
    recognitionRef.current?.stop();
    setPhase("thinking");
    setStatusText("Alex is thinking...");

    const answer = transcriptRef.current.trim();
    if (!answer) {
      setPhase("listening");
      setStatusText("Didn't catch that — try again");
      return;
    }

    const candidateMessage: Message = {
      role:    "candidate",
      content: answer,
    };

    const updatedMessages = [...messagesRef.current, candidateMessage];
    setMessages(updatedMessages);
    await callBrain(updatedMessages, answer);
  };

  // ─── Brain API call ────────────────────────────────────────────────────────

  const callBrain = async (
    updatedMessages: Message[],
    latestAnswer:    string
  ) => {
    try {
      const memory = {
        interviewRole,
        interviewLevel,
        interviewType,
        techStack,
        difficulty,
        initialQuestions,
        messages:       updatedMessages,
        candidateState,
      };

      const res  = await fetch("/api/brain", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ mode: "live_brain", memory, latestAnswer }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Brain failed");

      const brain = data.brain;

      const aiMessage: Message = {
        role:    "interviewer",
        content: brain.interviewerResponse,
      };

      const withAI = [...updatedMessages, aiMessage];
      setMessages(withAI);

      const score = brain.evaluation?.overallScore ?? 50;
      setCandidateState((prev) => ({
        ...prev,
        averageScore:             Math.round((prev.averageScore + score) / 2),
        mood:                     brain.candidateMood || prev.mood,
        turnCount:                prev.turnCount + 1,
        currentDifficulty:        brain.nextDifficulty ?? prev.currentDifficulty,
        consecutiveStrongAnswers: score >= 75 ? prev.consecutiveStrongAnswers + 1 : 0,
        consecutiveWeakAnswers:   score <= 45 ? prev.consecutiveWeakAnswers + 1 : 0,
      }));

      const newCandidateTurns = withAI.filter((m) => m.role === "candidate").length;
      const shouldEnd         = newCandidateTurns >= initialQuestions.length + 1;

      if (shouldEnd) {
        const closing =
          "That wraps up our interview. You did well today — your detailed feedback report will be ready in a moment.";
        speak(closing, () => endInterview(withAI));
      } else {
        speak(brain.interviewerResponse, () => {
          setPhase("listening");
          setStatusText("Your turn — click Start Answer when ready");
        });
      }
    } catch (err) {
      console.error("[AGENT_BRAIN_ERROR]", err);
      speak(
        "Let me continue. Can you walk me through a recent technical challenge you faced?",
        () => {
          setPhase("listening");
          setStatusText("Your turn — click Start Answer when ready");
        }
      );
    }
  };

  // ─── End interview + generate feedback ────────────────────────────────────
  // FIX: also marks the interview document as finalized in Firestore so it
  // shows up in the interviews collection with the correct role/techStack.

  const endInterview = async (finalMessages: Message[]) => {
    setPhase("finished");
    setStatusText("Generating your feedback report...");

    const transcriptForFeedback = finalMessages.map((m) => ({
      role:    m.role === "interviewer" ? "assistant" : "user",
      content: m.content,
    })) as { role: "user" | "assistant"; content: string }[];

     try {
//       // ── FIX: mark the interview document as finalized ──────────────────
//       // This is the write that was missing — it updates the existing
//       // interviews/{interviewId} document so it appears in Firestore
//       // with finalized:true, role, techstack, level, difficulty, questions.
//       await updateInterviewFinalized({
//         interviewId,
//         userId,
//         role:       interviewRole,
//         level:      interviewLevel,
//         type:       interviewType,
//         techStack,
//         difficulty,
//         questions:  initialQuestions,
//       });

      // ── Generate AI feedback ───────────────────────────────────────────
      const { success, feedbackId: id } = await createFeedback({
        interviewId,
        userId,
        transcript: transcriptForFeedback,
        feedbackId,
        mode:       interviewType as any,
        difficulty: difficulty    as any,
      });

      if (success && id) {
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error("[END_INTERVIEW_ERROR]", err);
      router.push("/");
    }
  };

  // ─── Manual end ───────────────────────────────────────────────────────────

  const handleManualEnd = () => {
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();

    const current = messagesRef.current;
    if (current.length > 1) {
      endInterview(current);
    } else {
      router.push("/");
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-5">

      {/* ══ Session header bar ══════════════════════════════════════════════ */}
      <div className="glass-card rounded-2xl px-5 py-3 flex items-center justify-between flex-wrap gap-3">

        {/* Left: status dot + text */}
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            isSpeaking  ? "bg-cyan-400 animate-pulse"   :
            isListening ? "bg-green-400 animate-pulse"  :
            isThinking  ? "bg-yellow-400 animate-pulse" :
            isFinished  ? "bg-gray-500"                 :
            "bg-white/20"
          }`} />
          <p className="text-sm text-gray-300">{statusText}</p>
        </div>

        {/* Right: timer + turn counter */}
        <div className="flex items-center gap-4">
          <Timer isRunning={isActive} />
          {isActive && (
            <span className="text-xs font-mono text-gray-500">
              Turn {candidateTurns} · {totalTurns * 2}/100
            </span>
          )}
        </div>
      </div>

      {/* ══ Participant cards ════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ── Alex card ─────────────────────────────────────────────────── */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            {/* Avatar + name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-lg font-bold flex-shrink-0">
                A
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Alex</p>
                <p className="text-xs text-cyan-400">Senior Interviewer · AI</p>
              </div>
            </div>

            {/* Waveform — active while AI speaks */}
            <Waveform isActive={isSpeaking} color="#22d3ee" bars={5} />
          </div>

          {/* Speaking status badge */}
          {isSpeaking ? (
            <span className="self-start text-xs px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              Interviewer is speaking...
            </span>
          ) : isThinking ? (
            <span className="self-start text-xs px-2.5 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 animate-pulse">
              Alex is thinking...
            </span>
          ) : null}

          {/* Latest interviewer message */}
          {messages.filter((m) => m.role === "interviewer").slice(-1).map((m, i) => (
            <p key={i} className="text-sm text-gray-300 leading-relaxed line-clamp-4">
              {m.content}
            </p>
          ))}
        </div>

        {/* ── Candidate card ────────────────────────────────────────────── */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            {/* Avatar + name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white text-lg font-bold flex-shrink-0 uppercase">
                {userName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{userName}</p>
                <p className="text-xs text-gray-400">Candidate</p>
              </div>
            </div>

            {/* Mic lock / active indicator */}
            {isListening ? (
              <Waveform isActive={true} color="#4ade80" bars={5} />
            ) : (
              <span className="text-xs text-gray-500 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" strokeLinecap="round"/>
                  <line x1="3" y1="3" x2="21" y2="21" strokeLinecap="round"/>
                </svg>
                Mic locked
              </span>
            )}
          </div>

          {/* Candidate state */}
          {isListening ? (
            <span className="self-start text-xs px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 animate-pulse">
              Microphone active — speak now
            </span>
          ) : (
            <p className="text-xs text-gray-600 italic">
              {isIdle
                ? "Waiting for interview to start"
                : "Microphone locked while AI processes"}
            </p>
          )}

          {/* Live transcript */}
          {isListening && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 min-h-[60px]">
              <p className="text-xs text-green-400 mb-1 uppercase tracking-wider">Live</p>
              <p className="text-sm text-gray-300 leading-relaxed">
                {transcript || "Start speaking..."}
              </p>
            </div>
          )}

          {/* Latest candidate answer (when not live) */}
          {!isListening && messages.filter((m) => m.role === "candidate").slice(-1).map((m, i) => (
            <p key={i} className="text-sm text-gray-400 leading-relaxed line-clamp-3">
              {m.content}
            </p>
          ))}
        </div>
      </div>

      {/* ══ Interview intensity bar ══════════════════════════════════════════ */}
      {isActive && (
        <div className="glass-card rounded-xl px-5 py-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Interview intensity</span>
            <span>{candidateState.currentDifficulty}/10</span>
          </div>
          {/* Gradient track: green → yellow → orange → red */}
          <div className="relative h-1.5 rounded-full overflow-hidden bg-white/5">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
              style={{
                width: `${intensity}%`,
                background: `linear-gradient(to right,
                  #22c55e 0%,
                  #facc15 40%,
                  #f97316 70%,
                  #ef4444 100%)`,
                clipPath: `inset(0 ${100 - intensity}% 0 0)`,
              }}
            />
            {/* Full gradient track (dim) */}
            <div
              className="absolute inset-0 rounded-full opacity-20"
              style={{
                background:
                  "linear-gradient(to right, #22c55e 0%, #facc15 40%, #f97316 70%, #ef4444 100%)",
              }}
            />
          </div>
        </div>
      )}

      {/* ══ Conversation transcript ══════════════════════════════════════════ */}
      <div className="glass-card rounded-2xl p-5">
        <p className="text-xs uppercase tracking-widest text-gray-600 mb-4">Conversation</p>
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
          {messages.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-6">
              Your interview conversation will appear here.
            </p>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === "candidate" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                  message.role === "interviewer"
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "bg-white/10 text-gray-300"
                }`}>
                  {message.role === "interviewer" ? "A" : userName.charAt(0).toUpperCase()}
                </div>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  message.role === "interviewer"
                    ? "bg-cyan-500/10 border border-cyan-500/20 text-gray-200 rounded-tl-none"
                    : "bg-white/5 border border-white/10 text-gray-300 rounded-tr-none"
                }`}>
                  {message.content}
                </div>
              </div>
            ))
          )}
          <div ref={convEndRef} />
        </div>
      </div>

      {/* ══ Controls ═════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-4 flex-wrap">

        {/* Start interview */}
        {isIdle && (
          <button
            onClick={handleStart}
            className="px-8 py-3 rounded-xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400 active:scale-95 transition-all"
          >
            Start Interview
          </button>
        )}

        {/* Listening controls */}
        {isListening && (
          <>
            <button
              onClick={startListening}
              className="px-6 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-500 active:scale-95 transition-all flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Start Answer
            </button>
            <button
              onClick={stopListening}
              className="px-6 py-3 rounded-xl bg-red-600/80 text-white font-semibold hover:bg-red-500 active:scale-95 transition-all"
            >
              Stop Answer →
            </button>
          </>
        )}

        {/* Thinking */}
        {isThinking && (
          <div className="px-6 py-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-sm animate-pulse">
            Alex is thinking...
          </div>
        )}

        {/* Speaking */}
        {isSpeaking && (
          <div className="px-6 py-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm animate-pulse">
            Alex is speaking...
          </div>
        )}

        {/* Finished */}
        {isFinished && (
          <div className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-gray-400 text-sm animate-pulse">
            Generating feedback report...
          </div>
        )}

        {/* Manual end */}
        {isActive && (
          <button
            onClick={handleManualEnd}
            className="px-6 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 active:scale-95 transition-all ml-auto"
          >
            End Interview
          </button>
        )}
      </div>
    </div>
  );
}
