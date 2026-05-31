// "use client";
// 
// import { useEffect, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import { createFeedback } from "@/lib/actions/general.action";
// 
// // ─── Types ────────────────────────────────────────────────────────────────────
// 
// interface Message {
//   role:    "interviewer" | "candidate";
//   content: string;
// }
// 
// interface AgentProps {
//   userName:         string;
//   userId:           string;
//   interviewId:      string;
//   feedbackId?:      string;
//   interviewRole:    string;
//   interviewLevel:   string;
//   interviewType:    string;
//   techStack:        string[];
//   difficulty:       string;
//   initialQuestions: string[];
// }
// 
// type InterviewPhase =
//   | "idle"        // not started
//   | "speaking"    // AI TTS active
//   | "listening"   // user answering
//   | "thinking"    // brain API call in flight
//   | "finished";   // interview over, generating feedback
// 
// // ─── Component ────────────────────────────────────────────────────────────────
// 
// export default function Agent({
//   userName,
//   userId,
//   interviewId,
//   feedbackId,
//   interviewRole,
//   interviewLevel,
//   interviewType,
//   techStack,
//   difficulty,
//   initialQuestions,
// }: AgentProps) {
//   const router = useRouter();
// 
//   // ── State ──────────────────────────────────────────────────────────────────
//   const [phase,       setPhase      ] = useState<InterviewPhase>("idle");
//   const [messages,    setMessages   ] = useState<Message[]>([]);
//   const [transcript,  setTranscript ] = useState("");
//   const [statusText,  setStatusText ] = useState("Click Start Interview to begin");
//   const [candidateState, setCandidateState] = useState({
//     currentDifficulty:        5,
//     topicsCovered:            [] as string[],
//     averageScore:             50,
//     consecutiveStrongAnswers: 0,
//     consecutiveWeakAnswers:   0,
//     mood:                     "neutral",
//     turnCount:                0,
//   });
// 
//   // ── Refs ───────────────────────────────────────────────────────────────────
//   const recognitionRef   = useRef<any>(null);
//   const messagesRef      = useRef<Message[]>([]);
//   const transcriptRef    = useRef<string>("");
// 
//   // keep refs in sync with state
//   useEffect(() => { messagesRef.current   = messages;   }, [messages]);
//   useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
// 
//   // ─── TTS ──────────────────────────────────────────────────────────────────
// 
//   const speak = (text: string, onDone?: () => void) => {
//     if (typeof window === "undefined" || !window.speechSynthesis) {
//       onDone?.();
//       return;
//     }
// 
//     window.speechSynthesis.cancel();
//     setPhase("speaking");
//     setStatusText("Alex is speaking...");
// 
//     const utterance   = new SpeechSynthesisUtterance(text);
//     utterance.rate    = 0.92;
//     utterance.pitch   = 1.0;
//     utterance.volume  = 1.0;
// 
//     // pick best available English voice
//     const voices    = window.speechSynthesis.getVoices();
//     const preferred = voices.find((v) =>
//       v.name.includes("Google UK English Female") ||
//       v.name.includes("Samantha") ||
//       v.name.includes("Karen")    ||
//       v.name.includes("Moira")
//     ) ?? voices.find((v) => v.lang.startsWith("en")) ?? null;
// 
//     if (preferred) utterance.voice = preferred;
// 
//     utterance.onend   = () => { onDone?.(); };
//     utterance.onerror = () => { onDone?.(); };
// 
//     // voices load async on first call
//     if (voices.length === 0) {
//       window.speechSynthesis.onvoiceschanged = () =>
//         window.speechSynthesis.speak(utterance);
//     } else {
//       window.speechSynthesis.speak(utterance);
//     }
//   };
// 
//   // ─── Speech Recognition setup ─────────────────────────────────────────────
// 
//   useEffect(() => {
//     if (typeof window === "undefined") return;
// 
//     const SR =
//       (window as any).SpeechRecognition ||
//       (window as any).webkitSpeechRecognition;
// 
//     if (!SR) return;
// 
//     const recognition          = new SR();
//     recognition.continuous     = true;
//     recognition.interimResults = true;
//     recognition.lang           = "en-US";
// 
//     recognition.onresult = (event: any) => {
//       let final   = "";
//       let interim = "";
//       for (let i = 0; i < event.results.length; i++) {
//         if (event.results[i].isFinal) {
//           final += event.results[i][0].transcript + " ";
//         } else {
//           interim += event.results[i][0].transcript;
//         }
//       }
//       setTranscript(final + interim);
//     };
// 
//     recognition.onerror = () => setPhase("listening");
// 
//     recognitionRef.current = recognition;
//   }, []);
// 
//   // ─── Start interview ───────────────────────────────────────────────────────
// 
//   const handleStart = () => {
//     if (!initialQuestions?.length) return;
// 
//     const opening = `Hi ${userName}! I'm Alex, your interviewer today. Let's get started. ${initialQuestions[0]}`;
//     const firstMessage: Message = {
//       role:    "interviewer",
//       content: initialQuestions[0],
//     };
// 
//     setMessages([firstMessage]);
//     speak(opening, () => {
//       setPhase("listening");
//       setStatusText("Your turn — click Start Answer when ready");
//     });
//   };
// 
//   // ─── Start listening ───────────────────────────────────────────────────────
// 
//   const startListening = () => {
//     if (phase !== "listening") return;
// 
//     setTranscript("");
//     transcriptRef.current = "";
//     setStatusText("Listening — speak your answer, then click Stop Answer");
// 
//     try {
//       recognitionRef.current?.start();
//     } catch {
//       // already started — ignore
//     }
//   };
// 
//   // ─── Stop listening → send to brain ───────────────────────────────────────
// 
//   const stopListening = async () => {
//     recognitionRef.current?.stop();
//     setPhase("thinking");
//     setStatusText("Alex is thinking...");
// 
//     const answer = transcriptRef.current.trim();
//     if (!answer) {
//       setPhase("listening");
//       setStatusText("Didn't catch that — try again");
//       return;
//     }
// 
//     const candidateMessage: Message = {
//       role:    "candidate",
//       content: answer,
//     };
// 
//     const updatedMessages = [...messagesRef.current, candidateMessage];
//     setMessages(updatedMessages);
// 
//     await callBrain(updatedMessages, answer);
//   };
// 
//   // ─── Brain API call ────────────────────────────────────────────────────────
// 
//   const callBrain = async (
//     updatedMessages: Message[],
//     latestAnswer:    string
//   ) => {
//     try {
//       const memory = {
//         interviewRole,
//         interviewLevel,
//         interviewType,
//         techStack,
//         difficulty,
//         initialQuestions,
//         messages:       updatedMessages,
//         candidateState,
//       };
// 
//       const res  = await fetch("/api/brain", {
//         method:  "POST",
//         headers: { "Content-Type": "application/json" },
//         body:    JSON.stringify({
//           mode:        "live_brain",
//           memory,
//           latestAnswer,
//         }),
//       });
// 
//       const data = await res.json();
//       if (!data.success) throw new Error(data.error || "Brain failed");
// 
//       const brain = data.brain;
// 
//       // Add interviewer response to messages
//       const aiMessage: Message = {
//         role:    "interviewer",
//         content: brain.interviewerResponse,
//       };
// 
//       const withAI = [...updatedMessages, aiMessage];
//       setMessages(withAI);
// 
//       // Update candidate state
//       const score = brain.evaluation?.overallScore ?? 50;
//       setCandidateState((prev) => ({
//         ...prev,
//         averageScore: Math.round((prev.averageScore + score) / 2),
//         mood:         brain.candidateMood || prev.mood,
//         turnCount:    prev.turnCount + 1,
//         consecutiveStrongAnswers:
//           score >= 75 ? prev.consecutiveStrongAnswers + 1 : 0,
//         consecutiveWeakAnswers:
//           score <= 45 ? prev.consecutiveWeakAnswers + 1 : 0,
//       }));
// 
//       // Check if interview should end (covered all initial questions + some extra)
//       const candidateTurns = withAI.filter((m) => m.role === "candidate").length;
//       const shouldEnd      = candidateTurns >= initialQuestions.length + 1;
// 
//       if (shouldEnd) {
//         const closing = "That wraps up our interview. You did well today — your detailed feedback report will be ready in a moment.";
//         speak(closing, () => endInterview(withAI));
//       } else {
//         speak(brain.interviewerResponse, () => {
//           setPhase("listening");
//           setStatusText("Your turn — click Start Answer when ready");
//         });
//       }
// 
//     } catch (err) {
//       console.error("[AGENT_BRAIN_ERROR]", err);
//       speak(
//         "Let me continue. Can you walk me through a recent technical challenge you faced?",
//         () => {
//           setPhase("listening");
//           setStatusText("Your turn — click Start Answer when ready");
//         }
//       );
//     }
//   };
// 
//   // ─── End interview + generate feedback ────────────────────────────────────
// 
//   const endInterview = async (finalMessages: Message[]) => {
//     setPhase("finished");
//     setStatusText("Generating your feedback report...");
// 
//     // Convert to feedback transcript format
//     const transcript = finalMessages.map((m) => ({
//       role:    m.role === "interviewer" ? "assistant" : "user",
//       content: m.content,
//     })) as { role: "user" | "assistant"; content: string }[];
// 
//     try {
//       const { success, feedbackId: id } = await createFeedback({
//         interviewId,
//         userId,
//         transcript,
//         feedbackId,
//         mode:       interviewType as any,
//         difficulty: difficulty    as any,
//       });
// 
//       if (success && id) {
//         router.push(`/interview/${interviewId}/feedback`);
//       } else {
//         router.push("/");
//       }
//     } catch {
//       router.push("/");
//     }
//   };
// 
//   // ─── Manual end ───────────────────────────────────────────────────────────
// 
//   const handleManualEnd = () => {
//     window.speechSynthesis?.cancel();
//     recognitionRef.current?.stop();
// 
//     const current = messagesRef.current;
//     if (current.length > 1) {
//       endInterview(current);
//     } else {
//       router.push("/");
//     }
//   };
// 
//   // ─── Derived ──────────────────────────────────────────────────────────────
// 
//   const isIdle      = phase === "idle";
//   const isListening = phase === "listening";
//   const isSpeaking  = phase === "speaking";
//   const isThinking  = phase === "thinking";
//   const isFinished  = phase === "finished";
//   const isActive    = !isIdle && !isFinished;
// 
//   const candidateTurns = messages.filter((m) => m.role === "candidate").length;
//   const progress       = initialQuestions.length > 0
//     ? Math.min((candidateTurns / initialQuestions.length) * 100, 100)
//     : 0;
// 
//   // ─── Render ───────────────────────────────────────────────────────────────
// 
//   return (
//     <div className="w-full space-y-6">
// 
//       {/* ── Status bar ──────────────────────────────────────────────────── */}
//       <div className="glass-card rounded-xl px-5 py-3 flex items-center justify-between flex-wrap gap-3">
//         <div className="flex items-center gap-2">
//           <span className={`w-2.5 h-2.5 rounded-full ${
//             isSpeaking ? "bg-cyan-400 animate-pulse"   :
//             isListening ? "bg-green-400 animate-pulse" :
//             isThinking  ? "bg-yellow-400 animate-pulse":
//             isFinished  ? "bg-gray-400"                :
//             "bg-white/20"
//           }`} />
//           <p className="text-sm text-gray-300">{statusText}</p>
//         </div>
// 
//         {isActive && (
//           <div className="flex items-center gap-3">
//             <span className="text-xs text-gray-500">
//               {candidateTurns} / {initialQuestions.length} questions answered
//             </span>
//             <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
//               <div
//                 className="h-full bg-cyan-500 rounded-full transition-all duration-700"
//                 style={{ width: `${progress}%` }}
//               />
//             </div>
//           </div>
//         )}
//       </div>
// 
//       {/* ── Conversation ────────────────────────────────────────────────── */}
//       <div className="w-full rounded-2xl border border-white/10 bg-black/30 p-6">
//         <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
//           {messages.length === 0 ? (
//             <p className="text-gray-500 text-center py-8">
//               Your interview conversation will appear here.
//             </p>
//           ) : (
//             messages.map((message, index) => (
//               <div
//                 key={index}
//                 className={`p-4 rounded-xl ${
//                   message.role === "interviewer"
//                     ? "bg-cyan-500/10 border border-cyan-500/20"
//                     : "bg-white/5 border border-white/10"
//                 }`}
//               >
//                 <p className="text-xs opacity-50 mb-2 font-medium uppercase tracking-wider">
//                   {message.role === "interviewer" ? "Alex • Interviewer" : userName}
//                 </p>
//                 <p className="text-sm leading-relaxed">{message.content}</p>
//               </div>
//             ))
//           )}
//         </div>
// 
//         {/* Live transcript while user speaks */}
//         {isListening && (
//           <div className="mt-4 rounded-xl bg-white/5 border border-white/10 min-h-[80px] p-4">
//             <p className="text-xs text-green-400 mb-1 uppercase tracking-wider">Your answer (live)</p>
//             <p className="text-sm text-gray-300">
//               {transcript || "Start speaking..."}
//             </p>
//           </div>
//         )}
//       </div>
// 
//       {/* ── Controls ────────────────────────────────────────────────────── */}
//       <div className="flex items-center gap-4 flex-wrap">
// 
//         {/* Start interview */}
//         {isIdle && (
//           <button
//             onClick={handleStart}
//             className="px-8 py-3 rounded-xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition-colors"
//           >
//             Start Interview
//           </button>
//         )}
// 
//         {/* Listening controls */}
//         {isListening && (
//           <>
//             <button
//               onClick={startListening}
//               className="px-6 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-500 transition-colors"
//             >
//               Start Answer
//             </button>
//             <button
//               onClick={stopListening}
//               className="px-6 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors"
//             >
//               Stop Answer →
//             </button>
//           </>
//         )}
// 
//         {/* Thinking indicator */}
//         {isThinking && (
//           <div className="px-6 py-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-sm">
//             <span className="animate-pulse">Alex is thinking...</span>
//           </div>
//         )}
// 
//         {/* Speaking indicator */}
//         {isSpeaking && (
//           <div className="px-6 py-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm">
//             <span className="animate-pulse">Alex is speaking...</span>
//           </div>
//         )}
// 
//         {/* Finished */}
//         {isFinished && (
//           <div className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-gray-400 text-sm animate-pulse">
//             Generating feedback report...
//           </div>
//         )}
// 
//         {/* Manual end (always visible while active) */}
//         {isActive && (
//           <button
//             onClick={handleManualEnd}
//             className="px-6 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors ml-auto"
//           >
//             End Interview
//           </button>
//         )}
//       </div>
//     </div>
//   );
// }
