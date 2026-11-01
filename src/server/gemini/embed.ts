import "server-only";
import { getGeminiClient } from "./client";

const rawModel = process.env.GEMINI_MODEL_EMBEDDING || "text-embedding-004";
const DEFAULT_EMBEDDING_MODEL =
  rawModel === "gemini-embedding-001" ? "text-embedding-004" : rawModel;
const EMBEDDING_DIM = parseInt(process.env.GEMINI_EMBEDDING_DIM || "768", 10);
const MAX_BATCH_SIZE = 50; // Safe batch limit for embedding requests

/**
 * Generates vector embeddings for an array of text snippets using Gemini text-embedding-004.
 * Returns an array of 768-dimensional number arrays.
 */
export async function generateEmbeddings(
  texts: string[],
  model: string = DEFAULT_EMBEDDING_MODEL
): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const resolvedModel = model === "gemini-embedding-001" ? "text-embedding-004" : model;
  const ai = getGeminiClient();
  const allEmbeddings: number[][] = [];

  // Process in batches
  for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
    const batch = texts.slice(i, i + MAX_BATCH_SIZE);

    const response = await ai.models.embedContent({
      model: resolvedModel,
      contents: batch,
      config: {
        outputDimensionality: EMBEDDING_DIM,
      },
    });

    if (response.embeddings && response.embeddings.length > 0) {
      for (const emb of response.embeddings) {
        if (!emb.values || emb.values.length === 0) {
          throw new Error("Gemini returned empty embedding values in batch.");
        }
        allEmbeddings.push(emb.values);
      }
    } else {
      throw new Error("Failed to receive embeddings from Gemini API.");
    }
  }

  return allEmbeddings;
}

/**
 * Generates a single vector embedding for a query string.
 */
export async function generateQueryEmbedding(
  query: string,
  model: string = DEFAULT_EMBEDDING_MODEL
): Promise<number[]> {
  const result = await generateEmbeddings([query], model);
  const first = result[0];
  if (!first) {
    throw new Error("Failed to generate embedding for query.");
  }
  return first;
}
