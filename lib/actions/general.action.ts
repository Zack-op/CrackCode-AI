"use server";

import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";

import { db } from "@/firebase/admin";

import {
  feedbackSchema,
  evaluationCategories,
  difficultyConfig,
} from "@/constants";

// ─────────────────────────────────────────────────────────────
// Providers
// ─────────────────────────────────────────────────────────────

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
});

// ─────────────────────────────────────────────────────────────
// Feedback
// ─────────────────────────────────────────────────────────────

export async function createFeedback(
  params: CreateFeedbackParams
) {
  const {
    interviewId,
    userId,
    transcript,
    feedbackId,
    mode = "technical",
    difficulty = "medium",
  } = params;

  try {
    const formattedTranscript = transcript
      .map(
        (message) =>
          `${message.role}: ${message.content}`
      )
      .join("\n\n");

    const categories =
      evaluationCategories[mode] ??
      evaluationCategories.technical;

    const categoryList = categories.join(
      ", "
    );

    const difficultyCtx =
      difficultyConfig[difficulty];

    const { object } =
      await generateObject({
        model: openai("gpt-4.1-mini"),

        schema: feedbackSchema,

        system:
          "You are an elite recruiter-grade AI evaluation engine.",

        prompt: `
Evaluate this interview transcript.

INTERVIEW TYPE:
${mode}

DIFFICULTY:
${difficultyCtx.label}

EVALUATION CATEGORIES:
${categoryList}

TRANSCRIPT:
${formattedTranscript}

Return strict JSON matching schema.
`,
      });

    const feedback = {
      interviewId,
      userId,

      mode,
      difficulty,

      totalScore: object.totalScore,

      categoryScores:
        object.categoryScores,

      strengths: object.strengths,

      weaknesses: object.weaknesses,

      improvementRoadmap:
        object.improvementRoadmap,

      finalAssessment:
        object.finalAssessment,

      hiringRecommendation:
        object.hiringRecommendation,

      hiringReadinessScore:
        object.hiringReadinessScore,

      createdAt:
        new Date().toISOString(),
    };

    let feedbackRef;

    if (feedbackId) {
      feedbackRef = db
        .collection("feedback")
        .doc(feedbackId);
    } else {
      feedbackRef = db
        .collection("feedback")
        .doc();
    }

    await feedbackRef.set(feedback);

    await updateAnalytics(
      userId,
      feedback.totalScore,
      mode
    );

    return {
      success: true,
      feedbackId: feedbackRef.id,
    };
  } catch (error) {
    console.error(
      "[CREATE_FEEDBACK_ERROR]",
      error
    );

    return {
      success: false,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────────────────────

async function updateAnalytics(
  userId: string,
  score: number,
  mode: string
) {
  try {
    const analyticsRef = db
      .collection("analytics")
      .doc(userId);

    const doc =
      await analyticsRef.get();

    const trend = {
      date: new Date().toISOString(),
      totalScore: score,
      mode,
    };

    if (!doc.exists) {
      await analyticsRef.set({
        userId,

        totalInterviews: 1,

        avgScore: score,

        trends: [trend],

        modeBreakdown: {
          [mode]: 1,
        },

        updatedAt:
          new Date().toISOString(),
      });

      return;
    }

    const data = doc.data()!;

    const totalInterviews =
      (data.totalInterviews || 0) + 1;

    const avgScore = Math.round(
      ((data.avgScore || 0) *
        (totalInterviews - 1) +
        score) /
        totalInterviews
    );

    const trends = [
      ...(data.trends || []),
      trend,
    ].slice(-50);

    const modeBreakdown = {
      ...(data.modeBreakdown || {}),

      [mode]:
        ((data.modeBreakdown || {})[
          mode
        ] || 0) + 1,
    };

    await analyticsRef.update({
      totalInterviews,

      avgScore,

      trends,

      modeBreakdown,

      updatedAt:
        new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "[ANALYTICS_ERROR]",
      error
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Interview Queries
// ─────────────────────────────────────────────────────────────

export async function getInterviewById(
  id: string
): Promise<Interview | null> {
  const doc = await db
    .collection("interviews")
    .doc(id)
    .get();

  if (!doc.exists) return null;

  return {
    id: doc.id,
    ...doc.data(),
  } as Interview;
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } =
    params;

  const snap = await db
    .collection("feedback")
    .where(
      "interviewId",
      "==",
      interviewId
    )
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (snap.empty) return null;

  const doc = snap.docs[0];

  return {
    id: doc.id,
    ...doc.data(),
  } as Feedback;
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } =
    params;

  const snap = await db
    .collection("interviews")
    .orderBy("createdAt", "desc")
    .where("finalized", "==", true)
    .where("userId", "!=", userId)
    .limit(limit)
    .get();

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function getInterviewsByUserId(
  userId:
    | string
    | undefined
    | null
): Promise<Interview[]> {
  if (!userId) return [];

  const snap = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

// ─────────────────────────────────────────────────────────────
// Coding Submission
// ─────────────────────────────────────────────────────────────

const zCodeEvalSchema = z.object({
  score: z.number(),

  evaluation: z.string(),
});

export async function saveCodingSubmission(
  params: {
    interviewId: string;
    userId: string;
    language: string;
    code: string;
    problem?: string;
  }
) {
  const {
    interviewId,
    userId,
    language,
    code,
    problem,
  } = params;

  try {
    const { object } =
      await generateObject({
        model:
          groq(
            "llama-3.3-70b-versatile"
          ),

        schema: zCodeEvalSchema,

        system:
          "You are a senior engineer reviewing interview code.",

        prompt: `
LANGUAGE:
${language}

PROBLEM:
${problem || "N/A"}

CODE:
${code}

Evaluate:
- correctness
- readability
- complexity
- edge cases

Return structured JSON.
`,
      });

    const submission = {
      interviewId,
      userId,

      language,
      code,

      problem:
        problem || null,

      aiEvaluation:
        object.evaluation,

      aiScore: object.score,

      createdAt:
        new Date().toISOString(),
    };

    const ref = db
      .collection(
        "codingSubmissions"
      )
      .doc();

    await ref.set(submission);

    return {
      success: true,

      id: ref.id,

      evaluation:
        object.evaluation,

      score: object.score,
    };
  } catch (error) {
    console.error(
      "[CODE_SUBMISSION_ERROR]",
      error
    );

    return {
      success: false,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Analytics Query
// ─────────────────────────────────────────────────────────────

export async function getAnalyticsByUserId(
  userId: string
): Promise<Analytics | null> {
  const doc = await db
    .collection("analytics")
    .doc(userId)
    .get();

  if (!doc.exists) return null;

  return doc.data() as Analytics;
}