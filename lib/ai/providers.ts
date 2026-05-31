import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-2.5-flash";

export const OPENAI_MODEL =
  process.env.OPENAI_MODEL || "gpt-4.1-mini";