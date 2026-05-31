// ─── Core User & Auth ────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt?: string;
}

interface SignInParams {
  email: string;
  idToken: string;
}

interface SignUpParams {
  uid: string;
  name: string;
  email: string;
  password: string;
}

type FormType = "sign-in" | "sign-up";

// ─── Interview Modes & Config ─────────────────────────────────────────────────

type InterviewMode =
  | "technical"
  | "hr"
  | "behavioral"
  | "dsa"
  | "systemDesign"
  | "resume"
  | "company";

type DifficultyLevel = "easy" | "medium" | "hard";

type InterviewerPersona =
  | "faang"
  | "startup"
  | "hr"
  | "dsa"
  | "mentor"
  | "architect";

// ─── Interview Object ─────────────────────────────────────────────────────────

interface Interview {
  id: string;
  userId: string;
  role: string;
  level: string;
  type: string;
  mode: InterviewMode;
  difficulty: DifficultyLevel;
  persona: InterviewerPersona;
  techstack: string[];
  questions: string[];
  finalized: boolean;
  createdAt: string;
  // Optional resume / company context
  resumeText?: string;
  targetCompany?: string;
}

// ─── Evaluation & Feedback ────────────────────────────────────────────────────

interface CategoryScore {
  name: string;
  score: number;   // 0–100
  comment: string;
}

interface Feedback {
  id: string;
  interviewId: string;
  userId: string;
  totalScore: number;            // weighted composite 0–100
  categoryScores: CategoryScore[];
  strengths: string[];
  weaknesses: string[];
  improvementRoadmap: string[];
  finalAssessment: string;
  hiringRecommendation: "Strong Hire" | "Hire" | "Hold" | "Reject";
  hiringReadinessScore: number;  // 0–100
  createdAt: string;
}

// ─── Coding Submission ────────────────────────────────────────────────────────

interface CodingSubmission {
  id: string;
  interviewId: string;
  userId: string;
  language: string;
  code: string;
  problem?: string;
  aiEvaluation?: string;
  aiScore?: number;
  createdAt: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

interface PerformanceTrend {
  date: string;
  totalScore: number;
  mode: InterviewMode;
}

interface Analytics {
  userId: string;
  totalInterviews: number;
  avgScore: number;
  strongestCategory: string;
  weakestCategory: string;
  trends: PerformanceTrend[];
  modeBreakdown: Record<InterviewMode, number>;
}

// ─── Prop Types ───────────────────────────────────────────────────────────────

interface InterviewCardProps {
  interviewId?: string;
  userId?: string;
  role: string;
  type: string;
  mode?: InterviewMode;
  difficulty?: DifficultyLevel;
  techstack: string[];
  createdAt?: string;
}

interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
  mode?: InterviewMode;
  difficulty?: DifficultyLevel;
  persona?: InterviewerPersona;
}

interface RouteParams {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}

interface GetFeedbackByInterviewIdParams {
  interviewId: string;
  userId: string;
}

interface GetLatestInterviewsParams {
  userId: string;
  limit?: number;
}

interface CreateFeedbackParams {
  interviewId: string;
  userId: string;
  transcript: { role: string; content: string }[];
  feedbackId?: string;
  mode?: InterviewMode;
  difficulty?: DifficultyLevel;
}

interface InterviewFormProps {
  interviewId: string;
  role: string;
  level: string;
  type: string;
  mode: InterviewMode;
  difficulty: DifficultyLevel;
  techstack: string[];
  amount: number;
}

interface TechIconProps {
  techStack: string[];
}

// ─── Vapi ─────────────────────────────────────────────────────────────────────

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}
// ─────────────────────────────────────────────────────────────
// Adaptive Runtime Types
// ─────────────────────────────────────────────────────────────

interface InterviewMessage {
  role: "interviewer" | "candidate";
  content: string;
}

interface CandidateState {
  currentDifficulty: number;
  topicsCovered: string[];
  averageScore: number;
  consecutiveStrongAnswers: number;
  consecutiveWeakAnswers: number;
  mood: string;
  turnCount: number;
}

interface ConversationMemory {
  interviewRole: string;
  interviewLevel: string;
  interviewType: string;
  techStack: string[];
  difficulty: string;

  initialQuestions: string[];

  messages: InterviewMessage[];

  candidateState: CandidateState;
}

interface BrainEvaluation {
  technicalDepth: number;
  confidence: number;
  clarity: number;
  communication: number;
  relevance: number;
  overallScore: number;
}

interface BrainResponse {
  evaluation: BrainEvaluation;

  candidateMood: string;

  difficultyAdjustment:
    | "increase"
    | "decrease"
    | "maintain";

  topicShift:
    | "continue"
    | "probe_deeper"
    | "pivot"
    | "encourage"
    | "challenge";

  interviewerResponse: string;

  reasoning: string;
}