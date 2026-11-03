
import "server-only";
import { executeWithGeminiPool } from "./client";

const rawModel = process.env.GEMINI_MODEL_EMBEDDING || "gemini-embedding-001";
const DEFAULT_EMBEDDING_MODEL = rawModel;
const EMBEDDING_DIM = parseInt(process.env.GEMINI_EMBEDDING_DIM || "768", 10);
const MAX_BATCH_SIZE = 50; // Safe batch limit for embedding requests

/**
 * Generates vector embeddings for an array of text snippets using Gemini embeddings.
 * Returns an array of 768-dimensional number arrays.
 */
export async function generateEmbeddings(
  texts: string[],
  model: string = DEFAULT_EMBEDDING_MODEL
): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const resolvedModel = model;
  const allEmbeddings: number[][] = [];

  // Process in batches
  for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
    const batch = texts.slice(i, i + MAX_BATCH_SIZE);

    try {
      const response = await executeWithGeminiPool(
        (client) =>
          client.models.embedContent({
            model: resolvedModel,
            contents: batch,
            config: {
              outputDimensionality: EMBEDDING_DIM,
            },
          }),
        { label: "Gemini Embeddings" }
      );

      const resAny = response as unknown as {
        embeddings?: Array<{ values?: number[] }>;
        embedding?: { values?: number[] };
      };

      if (resAny.embeddings && resAny.embeddings.length > 0) {
        for (const emb of resAny.embeddings) {
          if (!emb.values || emb.values.length === 0) {
            throw new Error("Gemini returned empty embedding values in batch.");
          }
          allEmbeddings.push(emb.values);
        }
      } else if (resAny.embedding?.values && resAny.embedding.values.length > 0) {
        allEmbeddings.push(resAny.embedding.values);
      } else {
        throw new Error(
          `Unexpected response structure from Gemini embedContent: ${JSON.stringify(response).slice(0, 200)}`
        );
      }
    } catch (batchErr: unknown) {
      const msg = batchErr instanceof Error ? batchErr.message : String(batchErr);
      console.error(`[Gemini Embed] Error embedding batch with model "${resolvedModel}":`, msg);
      throw new Error(`Embedding generation failed (${resolvedModel}): ${msg}`);
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
