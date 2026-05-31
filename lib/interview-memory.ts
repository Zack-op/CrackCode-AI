// lib/interview-memory.ts
// Phase 3A — Interview Memory Engine

import type {
  ConversationMemory,
  InterviewMessage,
  CandidateState,
  BrainResponse,
  MessageRole,
} from "@/types/interview";

// ─── Initial State Factory ────────────────────────────────────────────────────

export function createInitialCandidateState(): CandidateState {
  return {
    currentDifficulty: 5,
    consecutiveStrongAnswers: 0,
    consecutiveWeakAnswers: 0,
    topicsCovered: [],
    averageScore: 50,
    turnCount: 0,
    mood: "relaxed",
  };
}

export function createConversationMemory(params: {
  interviewRole: string;
  interviewLevel: string;
  interviewType: string;
  techStack: string[];
  difficulty: string;
  initialQuestions: string[];
}): ConversationMemory {
  return {
    ...params,
    messages: [],
    candidateState: createInitialCandidateState(),
  };
}

// ─── Message Operations ───────────────────────────────────────────────────────

export function addMessage(
  memory: ConversationMemory,
  role: MessageRole,
  content: string,
  topicArea?: string
): ConversationMemory {
  const message: InterviewMessage = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    content: content.trim(),
    timestamp: Date.now(),
    topicArea,
  };

  return {
    ...memory,
    messages: [...memory.messages, message],
  };
}

// ─── State Updates After Brain Response ───────────────────────────────────────

export function updateCandidateState(
  memory: ConversationMemory,
  brainResponse: BrainResponse
): ConversationMemory {
  const { evaluation, candidateMood, difficultyAdjustment } = brainResponse;
  const prev = memory.candidateState;

  // Update difficulty level
  let newDifficulty = prev.currentDifficulty;
  if (difficultyAdjustment === "increase") {
    newDifficulty = Math.min(10, newDifficulty + 1);
  } else if (difficultyAdjustment === "decrease") {
    newDifficulty = Math.max(1, newDifficulty - 1);
  }

  // Track consecutive performance streaks
  const isStrongAnswer = evaluation.overallScore >= 70;
  const isWeakAnswer = evaluation.overallScore < 45;

  const consecutiveStrongAnswers = isStrongAnswer
    ? prev.consecutiveStrongAnswers + 1
    : 0;
  const consecutiveWeakAnswers = isWeakAnswer
    ? prev.consecutiveWeakAnswers + 1
    : 0;

  // Rolling average (weighted toward recent)
  const newAverage =
    prev.turnCount === 0
      ? evaluation.overallScore
      : prev.averageScore * 0.7 + evaluation.overallScore * 0.3;

  // Track topics from the interviewer's last question
  const lastInterviewerMsg = [...memory.messages]
    .reverse()
    .find((m) => m.role === "interviewer");

  const topicsCovered = lastInterviewerMsg?.topicArea
    ? [...new Set([...prev.topicsCovered, lastInterviewerMsg.topicArea])]
    : prev.topicsCovered;

  return {
    ...memory,
    candidateState: {
      currentDifficulty: newDifficulty,
      consecutiveStrongAnswers,
      consecutiveWeakAnswers,
      topicsCovered,
      averageScore: Math.round(newAverage),
      turnCount: prev.turnCount + 1,
      mood: candidateMood,
    },
  };
}

// ─── Memory Serialization (for Firestore) ────────────────────────────────────

export function serializeMemoryForStorage(memory: ConversationMemory) {
  return {
    messages: memory.messages.map((m) => ({
      role: m.role === "interviewer" ? "assistant" : "user",
      content: m.content,
    })),
    candidateState: memory.candidateState,
    metadata: {
      interviewRole: memory.interviewRole,
      interviewLevel: memory.interviewLevel,
      interviewType: memory.interviewType,
      techStack: memory.techStack,
      difficulty: memory.difficulty,
    },
  };
}

// ─── Interview Completion Check ───────────────────────────────────────────────

export function shouldEndInterview(memory: ConversationMemory): boolean {
  const { candidateState, initialQuestions } = memory;

  // End after covering enough topics or enough turns
  const minTurns = Math.max(initialQuestions.length, 4);
  const maxTurns = initialQuestions.length + 3; // allow a few extra organic turns

  if (candidateState.turnCount >= maxTurns) return true;

  // Also end if topics covered >= questions prepared
  if (candidateState.topicsCovered.length >= initialQuestions.length) {
    // Give at least one turn after all topics covered
    return candidateState.turnCount > initialQuestions.length;
  }

  return false;
}

// ─── Summary for Feedback Generation ─────────────────────────────────────────

export function buildFeedbackSummary(memory: ConversationMemory) {
  const { candidateState, messages } = memory;

  // Extract all candidate answers
  const candidateMessages = messages
    .filter((m) => m.role === "candidate")
    .map((m) => m.content);

  // Extract all interviewer questions
  const interviewerMessages = messages
    .filter((m) => m.role === "interviewer")
    .map((m) => m.content);

  return {
    averageScore: candidateState.averageScore,
    finalMood: candidateState.mood,
    totalTurns: candidateState.turnCount,
    topicsCovered: candidateState.topicsCovered,
    peakDifficulty: candidateState.currentDifficulty,
    consecutivePeaks: Math.max(
      candidateState.consecutiveStrongAnswers,
      candidateState.consecutiveWeakAnswers
    ),
    candidateAnswerCount: candidateMessages.length,
    interviewerQuestionCount: interviewerMessages.length,
    // Full transcript for Gemini feedback generation
    transcript: messages.map((m) => ({
      role: m.role === "interviewer" ? "assistant" : "user",
      content: m.content,
    })),
  };
}
