import { generateObject, generateText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

import type {
  ConversationMemory,
  BrainResponse,
} from "@/types/interview";

// ─── Model ────────────────────────────────────────────────────────────────────
// gemini-2.0-flash works with @ai-sdk/google@2.x
const model = google("gemini-2.0-flash");

// ─── Schema ───────────────────────────────────────────────────────────────────
const BrainSchema = z.object({
  interviewerResponse: z.string(),
  candidateMood: z.enum([
    "confident",
    "nervous",
    "slightly_nervous",
    "confused",
    "engaged",
    "disengaged",
    "frustrated",
    "relaxed",
  ]),
  difficultyAdjustment: z.enum(["increase", "decrease", "maintain"]),
  topicShift: z.enum(["continue", "probe_deeper", "pivot", "encourage", "challenge"]),
  reasoning: z.string(),
  evaluation: z.object({
    technicalDepth:  z.number(),
    confidence:      z.number(),
    clarity:         z.number(),
    communication:   z.number(),
    relevance:       z.number(),
    overallScore:    z.number(),
  }),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildConversationContext(memory: ConversationMemory): string {
  return memory.messages
    .slice(-12)
    .map((m) => {
      const label =
        m.role === "interviewer" ? "INTERVIEWER" :
        m.role === "candidate"   ? "CANDIDATE"   : "SYSTEM";
      return `${label}: ${m.content}`;
    })
    .join("\n");
}

// ─── Main Brain ───────────────────────────────────────────────────────────────
export async function runBrain(
  memory: ConversationMemory,
  latestCandidateAnswer: string
): Promise<BrainResponse> {
  try {
    const conversation = buildConversationContext(memory);

    const { object } = await generateObject({
      model,
      schema: BrainSchema,
      prompt: `
You are Alex — a highly intelligent senior interviewer conducting a REAL interview.

You are NOT a chatbot. You are NOT an assistant. You are NOT motivational.

You behave like a real interviewer: thoughtful, adaptive, conversational, observant, context-aware.

INTERVIEW CONTEXT:
Role: ${memory.interviewRole}
Level: ${memory.interviewLevel}
Type: ${memory.interviewType}
Difficulty: ${memory.difficulty}
Tech Stack: ${memory.techStack.join(", ")}

CANDIDATE STATE:
Average Score: ${memory.candidateState.averageScore}
Current Difficulty: ${memory.candidateState.currentDifficulty}/10
Mood: ${memory.candidateState.mood}

RECENT CONVERSATION:
${conversation}

LATEST CANDIDATE ANSWER:
${latestCandidateAnswer}

YOUR TASK:
1. Understand the candidate answer deeply.
2. Evaluate technical depth, confidence, clarity, and relevance honestly.
3. Decide: probe deeper / follow-up / switch topic / simplify / increase pressure.
4. Ask a REAL next interview question.
5. Sound human and conversational. Under 80 words.

BANNED PHRASES (never use these):
- "Let's shift gears"
- "That gives me context"
- "Interesting"
- "Great answer"
- "Let's continue"

GOOD RESPONSE EXAMPLE:
"You mentioned distributed caching. What tradeoffs did you face when deciding between Redis and a database-level cache? Were there cases where one clearly outperformed the other?"

Return valid JSON only matching the schema.
`,
    });

    return object;

  } catch (err) {
    console.error("[BRAIN ERROR]", err);

    return {
      interviewerResponse:
        "Walk me through a technically challenging problem you faced recently — what made it hard, and how did you approach it?",
      candidateMood:        "relaxed",
      difficultyAdjustment: "maintain",
      topicShift:           "continue",
      reasoning:            "Fallback response",
      evaluation: {
        technicalDepth: 50,
        confidence:     50,
        clarity:        50,
        communication:  50,
        relevance:      50,
        overallScore:   50,
      },
    };
  }
}

// ─── Opening Message ──────────────────────────────────────────────────────────
export async function generateOpeningMessage(
  memory: ConversationMemory
): Promise<string> {
  const { text } = await generateText({
    model,
    prompt: `
You are Alex, a senior technical interviewer.

Create a natural, warm interview opening for a ${memory.interviewLevel} ${memory.interviewRole} candidate.

Requirements:
- warm but professional
- realistic and human-sounding
- concise (under 60 words)
- end with your first interview question related to their role
- do NOT sound robotic or corporate
`,
  });

  return text;
}

// ─── Closing Message ──────────────────────────────────────────────────────────
export async function generateClosingMessage(
  memory: ConversationMemory
): Promise<string> {
  const { text } = await generateText({
    model,
    prompt: `
You are Alex, wrapping up a ${memory.interviewType} interview for a ${memory.interviewRole} role.

Generate a realistic, warm interview closing.

Requirements:
- professional and human
- thank the candidate genuinely
- mention their feedback report will be ready shortly
- under 60 words
`,
  });

  return text;
}