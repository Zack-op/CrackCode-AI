// types/interview.ts
// Phase 3A — Conversational Brain Types

export type MessageRole = "interviewer" | "candidate" | "system";

export type CandidateMood =
  | "confident"
  | "nervous"
  | "slightly_nervous"
  | "confused"
  | "engaged"
  | "disengaged"
  | "frustrated"
  | "relaxed";

export type DifficultyAdjustment =
  | "increase"
  | "decrease"
  | "maintain";

export type TopicShift =
  | "continue"      // follow up on current topic
  | "probe_deeper"  // push harder on same area
  | "pivot"         // move to a new topic
  | "encourage"     // candidate is struggling, be supportive
  | "challenge";    // candidate is performing well, push them

// A single message in the conversation
export interface InterviewMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  // Metadata attached to interviewer messages
  topicArea?: string;
  questionDepth?: number; // 1 = surface, 5 = deep
}

// Per-turn evaluation of candidate answer
export interface TurnEvaluation {
  technicalDepth: number;   // 0–100
  confidence: number;       // 0–100
  clarity: number;          // 0–100
  communication: number;    // 0–100
  relevance: number;        // 0–100 — did they actually answer?
  overallScore: number;     // 0–100 composite
}

// What the brain returns for each turn
export interface BrainResponse {
  evaluation: TurnEvaluation;
  candidateMood: CandidateMood;
  difficultyAdjustment: DifficultyAdjustment;
  topicShift: TopicShift;
  // What the interviewer says next (acknowledgment + question combined)
  interviewerResponse: string;
  // Reasoning (used for debugging, not shown to user)
  reasoning?: string;
}

// Running state of the candidate
export interface CandidateState {
  currentDifficulty: number;     // 1–10 scale
  consecutiveStrongAnswers: number;
  consecutiveWeakAnswers: number;
  topicsCovered: string[];
  averageScore: number;
  turnCount: number;
  mood: CandidateMood;
}

// Full conversation memory passed to brain on every turn
export interface ConversationMemory {
  interviewRole: string;
  interviewLevel: string;
  interviewType: string;
  techStack: string[];
  difficulty: string;
  messages: InterviewMessage[];
  candidateState: CandidateState;
  initialQuestions: string[]; // seed questions from generation phase
}

// The full transcript entry stored in Firestore
export interface TranscriptMessage {
  role: "user" | "assistant" | "system";
  content: string;
}
