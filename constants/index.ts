export const APP_CONFIG = {
  name: "CrackCode AI",
  version: "3B",
  tagline: "Adaptive AI Interview Intelligence Platform",
};

// ─────────────────────────────────────────────────────────────
// Interview Modes
// ─────────────────────────────────────────────────────────────

export const interviewTypes = [
  {
    id: "technical",
    label: "Technical",
    description: "Coding, architecture, debugging, systems",
  },
  {
    id: "behavioral",
    label: "Behavioral",
    description: "Communication, leadership, teamwork",
  },
  {
    id: "mixed",
    label: "Mixed",
    description: "Balanced technical + behavioral interview",
  },
];

// ─────────────────────────────────────────────────────────────
// Difficulty System
// ─────────────────────────────────────────────────────────────

export const difficultyConfig = {
  easy: {
    label: "Easy",
    intensity: 3,
    pressure: "low",
    description: "Foundational and beginner-friendly",
  },

  medium: {
    label: "Medium",
    intensity: 5,
    pressure: "moderate",
    description: "Balanced interview depth",
  },

  hard: {
    label: "Hard",
    intensity: 8,
    pressure: "high",
    description: "Senior-level deep probing",
  },
};

// ─────────────────────────────────────────────────────────────
// Adaptive Interview Settings
// ─────────────────────────────────────────────────────────────

export const adaptiveConfig = {
  strongAnswerThreshold: 75,
  weakAnswerThreshold: 45,

  maxDifficulty: 10,
  minDifficulty: 1,

  escalationTurns: 2,
  fallbackTurns: 2,

  memoryWindow: 10,
};

// ─────────────────────────────────────────────────────────────
// Interview Evaluation Categories
// ─────────────────────────────────────────────────────────────

export const evaluationCategories = [
  "technicalDepth",
  "confidence",
  "clarity",
  "communication",
  "problemSolving",
  "relevance",
];

// ─────────────────────────────────────────────────────────────
// Evaluation Weight System
// ─────────────────────────────────────────────────────────────

export const evaluationWeights = {
  technicalDepth: 0.25,
  confidence: 0.15,
  clarity: 0.15,
  communication: 0.15,
  problemSolving: 0.2,
  relevance: 0.1,
};

// ─────────────────────────────────────────────────────────────
// Feedback Schema
// ─────────────────────────────────────────────────────────────

export const feedbackSchema = {
  overallScore: 0,

  communication: {
    score: 0,
    feedback: "",
  },

  technicalDepth: {
    score: 0,
    feedback: "",
  },

  confidence: {
    score: 0,
    feedback: "",
  },

  problemSolving: {
    score: 0,
    feedback: "",
  },

  strengths: [],

  improvements: [],

  recommendation: "",
};

// ─────────────────────────────────────────────────────────────
// Voice Settings
// ─────────────────────────────────────────────────────────────

export const voiceConfig = {
  rate: 1,
  pitch: 1,
  volume: 1,

  pauseAfterQuestion: 1200,
  pauseAfterGreeting: 1500,
};

// ─────────────────────────────────────────────────────────────
// Brain System
// ─────────────────────────────────────────────────────────────

export const brainConfig = {
  provider: "gemini",

  model: "gemini-2.5-pro",

  temperature: 0.7,

  maxOutputTokens: 500,

  conversationalStyle: "adaptive",

  memoryEnabled: true,
};

// ─────────────────────────────────────────────────────────────
// UI Interview Intensity Colors
// ─────────────────────────────────────────────────────────────

export const intensityLevels = {
  relaxed: {
    value: 3,
    label: "Relaxed",
  },

  balanced: {
    value: 5,
    label: "Balanced",
  },

  pressure: {
    value: 8,
    label: "Pressure",
  },
};

// ─────────────────────────────────────────────────────────────
// Default Opening Questions
// ─────────────────────────────────────────────────────────────

export const defaultOpeningQuestions = [
  "Tell me about yourself.",
  "Walk me through a recent project you're proud of.",
  "What kind of engineering problems excite you most?",
  "Tell me about a technical challenge you recently solved.",
];

// ─────────────────────────────────────────────────────────────
// Behavioral Signal Tracking
// ─────────────────────────────────────────────────────────────

export const behavioralSignals = {
  hesitationWords: [
    "uh",
    "um",
    "like",
    "you know",
    "sort of",
    "kind of",
  ],

  confidenceIndicators: [
    "definitely",
    "implemented",
    "optimized",
    "designed",
    "improved",
  ],

  uncertaintyIndicators: [
    "maybe",
    "probably",
    "not sure",
    "i think",
    "possibly",
  ],
};
// ─────────────────────────────────────────────────────────────
// Interview Covers
// ─────────────────────────────────────────────────────────────

export const interviewCovers = [
  "/covers/ai.png",
  "/covers/code.png",
  "/covers/robot.png",
  "/covers/system.png",
  "/covers/frontend.png",
];