import "server-only";

export interface RetrievedChunk {
  id: string;
  documentId: string;
  documentTitle?: string;
  chunkIndex: number;
  unitLabel: string;
  pageStart: number;
  pageEnd: number;
  content: string;
  tokenCount: number;
  similarity?: number;
}

const DEFAULT_TOKEN_BUDGET = parseInt(
  process.env.GEN_CONTEXT_TOKEN_BUDGET || "24000",
  10
);

/**
 * Assembles retrieved chunks into a securely bounded RAG context string,
 * wrapping each chunk in [CHUNK ...][/CHUNK] tags and strictly respecting the token budget.
 */
export function buildContextFromChunks(
  chunks: RetrievedChunk[],
  tokenBudget: number = DEFAULT_TOKEN_BUDGET
): { contextText: string; includedChunkIds: string[]; totalTokens: number } {
  const includedChunkIds: string[] = [];
  const chunkBlocks: string[] = [];
  let accumulatedTokens = 0;

  for (const chunk of chunks) {
    if (accumulatedTokens + chunk.tokenCount > tokenBudget && chunkBlocks.length > 0) {
      break;
    }

    const docName = chunk.documentTitle || `Document ${chunk.documentId.slice(0, 8)}`;
    const pageRange =
      chunk.pageStart === chunk.pageEnd
        ? `p.${chunk.pageStart}`
        : `pp.${chunk.pageStart}-${chunk.pageEnd}`;

    const block = `[CHUNK id="${chunk.id}" doc="${docName}" pages="${pageRange}" unit="${chunk.unitLabel}"]\n${chunk.content}\n[/CHUNK]`;

    chunkBlocks.push(block);
    includedChunkIds.push(chunk.id);
    accumulatedTokens += chunk.tokenCount;
  }

  return {
    contextText: chunkBlocks.join("\n\n"),
    includedChunkIds,
    totalTokens: accumulatedTokens,
  };
}

