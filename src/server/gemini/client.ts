import "server-only";
import { GoogleGenAI } from "@google/genai";

let genAiInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (genAiInstance) {
    return genAiInstance;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }

  genAiInstance = new GoogleGenAI({ apiKey });
  return genAiInstance;
}

