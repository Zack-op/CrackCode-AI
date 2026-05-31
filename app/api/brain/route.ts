import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { db } from "@/firebase/admin";
import { buildBrainPrompt } from "@/lib/prompts/interviewer";

// ─── Providers ────────────────────────────────────────────────────────────────

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
});

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

// ─── Models ───────────────────────────────────────────────────────────────────

// openai/gpt-oss-20b supports structured outputs in best-effort (strict: false)
// Must use mode: 'json' — NOT the default json_schema format
const GROQ_MODEL   = groq("openai/gpt-oss-20b");
const GEMINI_MODEL = google(process.env.GEMINI_MODEL || "gemini-2.0-flash");

// ─── Schemas ──────────────────────────────────────────────────────────────────

const InterviewSchema = z.object({
  role:       z.string(),
  level:      z.string(),
  type:       z.string(),
  difficulty: z.string(),
  techstack:  z.array(z.string()),
  questions:  z.array(z.string()),
});

const BrainSchema = z.object({
  evaluation: z.object({
    technicalDepth: z.number(),
    confidence:     z.number(),
    clarity:        z.number(),
    communication:  z.number(),
    relevance:      z.number(),
    overallScore:   z.number(),
  }),
  candidateMood:        z.string(),
  difficultyAdjustment: z.string(),
  topicShift:           z.string(),
  interviewerResponse:  z.string(),
  reasoning:            z.string(),
});

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    success: true,
    architecture: {
      generation:    "Groq — openai/gpt-oss-20b (json mode)",
      adaptiveBrain: "Gemini — " + (process.env.GEMINI_MODEL || "gemini-2.0-flash"),
      evaluation:    "Gemini",
    },
  });
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode } = body;

    // ── GENERATE INTERVIEW (Groq, json mode) ──────────────────────────────────
    if (mode === "generate_interview") {
      const { role, level, type, difficulty, techstack, amount, userId } = body;

      if (!role || !level) {
        return NextResponse.json(
          { success: false, error: "Missing required fields: role, level" },
          { status: 400 }
        );
      }

      const safeTechstack = Array.isArray(techstack) ? techstack : [];
      const safeAmount    = Number(amount) || 5;

      const { object } = await generateObject({
        model:  GROQ_MODEL,
        schema: InterviewSchema,
        mode:   "json",          // ← key fix: best-effort JSON, not json_schema
        system: "You are an expert technical interviewer. Return only valid structured JSON matching the schema exactly. No extra text.",
        prompt: `
Generate a realistic ${difficulty || "medium"} ${type || "technical"} mock interview.

ROLE:       ${role}
LEVEL:      ${level}
TECH STACK: ${safeTechstack.length ? safeTechstack.join(", ") : "General Software Engineering"}

Generate exactly ${safeAmount} interview questions.

Rules:
- Questions must feel like a real interviewer asking them
- Conversational and voice-friendly — no bullet points or formatting
- No numbering — each question is a clean sentence
- Mix conceptual understanding, practical experience, and tradeoffs
- Difficulty progresses naturally through the list
- Fill all schema fields: role, level, type, difficulty, techstack, questions
`,
      });

      // Save to Firestore
      const docRef = await db.collection("interviews").add({
        role:       object.role       || role,
        level:      object.level      || level,
        type:       object.type       || type       || "technical",
        difficulty: object.difficulty || difficulty || "medium",
        techstack:  object.techstack?.length ? object.techstack : safeTechstack,
        questions:  object.questions,
        finalized:  true,
        coverImage: "/covers/robot.png",
        createdAt:  new Date().toISOString(),
        userId:     userId || "anonymous",
      });

      return NextResponse.json({
        success:     true,
        interviewId: docRef.id,
      });
    }

    // ── LIVE BRAIN (Gemini) ───────────────────────────────────────────────────
    if (mode === "live_brain") {
      const { memory, latestAnswer } = body;

      if (!memory || !latestAnswer) {
        return NextResponse.json(
          { success: false, error: "Missing memory or latestAnswer" },
          { status: 400 }
        );
      }

      const prompt = buildBrainPrompt(memory, latestAnswer);

      const { object } = await generateObject({
        model:  GEMINI_MODEL,
        schema: BrainSchema,
        prompt,
        system: "You are an adaptive AI interviewer. Return ONLY valid JSON matching the schema.",
      });

      return NextResponse.json({
        success: true,
        brain:   object,
      });
    }

    return NextResponse.json(
      { success: false, error: `Invalid mode: ${mode}` },
      { status: 400 }
    );

  } catch (error: any) {
    console.error("[BRAIN_API_ERROR]", error?.message || error);

    return NextResponse.json(
      {
        success: false,
        error:   error?.message || "Brain system failure",
      },
      { status: 500 }
    );
  }
}