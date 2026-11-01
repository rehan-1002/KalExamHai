import "server-only";
import type { ExtractedDocument, PageContent } from "./extract-text";

export interface DocumentChunkDraft {
  chunkIndex: number;
  unitLabel: string;
  pageStart: number;
  pageEnd: number;
  content: string;
  tokenCount: number;
}

// On Vercel Hobby the function timeout is strictly 10 seconds.
// Having 10-16 rich chunks (matching 6 syllabus modules) embeds in ~1.5s total.
const TARGET_MIN_TOKENS = 500;
const TARGET_MAX_TOKENS = 1200;
const OVERLAP_TOKENS = 50;
const MAX_CHUNKS = 16;

// Approximate token estimator (average 4 chars per token)
export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

// Regex to detect Mumbai University syllabus units/modules
const UNIT_HEADING_REGEX =
  /(?:^|\n)(?:#+\s*)?(?:Module|Unit|Chapter|Part|Section)\s*([0-9IVXLCDM]+)[\s:.-]*([^\n]{0,60})/i;

/**
 * Detects unit or module label from text segment.
 */
function detectUnitLabel(text: string): string | null {
  const match = text.match(UNIT_HEADING_REGEX);
  if (match && match[1]) {
    const num = match[1].trim();
    const title = match[2] ? match[2].trim() : "";
    return title ? `Module ${num}: ${title}` : `Module ${num}`;
  }
  return null;
}

/**
 * Splits extracted document pages into cohesive, token-bounded chunks
 * with unit/module tracking and page range attribution.
 */
export function chunkDocument(doc: ExtractedDocument): DocumentChunkDraft[] {
  const chunks: DocumentChunkDraft[] = [];
  let currentUnitLabel = "General";
  let currentChunkText = "";
  let chunkPageStart = doc.pages[0]?.pageNumber || 1;
  let chunkPageEnd = chunkPageStart;
  let chunkIndex = 0;

  for (const page of doc.pages) {
    const pageNum = page.pageNumber;
    const paragraphs = page.text.split(/\n\s*\n/);

    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();
      if (!trimmed) continue;

      // Check if paragraph introduces a new Module or Unit
      const detectedUnit = detectUnitLabel(trimmed);
      if (detectedUnit) {
        currentUnitLabel = detectedUnit;
      }

      const pTokens = estimateTokens(trimmed);
      const currentTokens = estimateTokens(currentChunkText);

      // If adding this paragraph exceeds TARGET_MAX_TOKENS and we have accumulated enough
      if (currentTokens + pTokens > TARGET_MAX_TOKENS && currentTokens >= TARGET_MIN_TOKENS) {
        // Finalize current chunk
        chunks.push({
          chunkIndex,
          unitLabel: currentUnitLabel,
          pageStart: chunkPageStart,
          pageEnd: chunkPageEnd,
          content: currentChunkText.trim(),
          tokenCount: currentTokens,
        });

        chunkIndex++;

        // Calculate overlap from tail of current text
        const overlapChars = OVERLAP_TOKENS * 4;
        const tail = currentChunkText.slice(-overlapChars).trim();
        currentChunkText = tail ? `${tail}\n\n${trimmed}` : trimmed;
        chunkPageStart = pageNum;
        chunkPageEnd = pageNum;
      } else {
        // Accumulate
        if (!currentChunkText) {
          chunkPageStart = pageNum;
        }
        chunkPageEnd = pageNum;
        currentChunkText = currentChunkText
          ? `${currentChunkText}\n\n${trimmed}`
          : trimmed;
      }
    }
  }

  // Final flush of remaining text
  if (currentChunkText.trim()) {
    chunks.push({
      chunkIndex,
      unitLabel: currentUnitLabel,
      pageStart: chunkPageStart,
      pageEnd: chunkPageEnd,
      content: currentChunkText.trim(),
      tokenCount: estimateTokens(currentChunkText),
    });
  }

  // Fallback: If document was too short for any paragraph splits, ensure at least one chunk exists
  if (chunks.length === 0 && doc.text.trim()) {
    chunks.push({
      chunkIndex: 0,
      unitLabel: "General",
      pageStart: 1,
      pageEnd: doc.pageCount || 1,
      content: doc.text.trim(),
      tokenCount: estimateTokens(doc.text),
    });
  }

  // Hard cap: if we still have too many chunks, merge the tail ones so we stay
  // within the MAX_CHUNKS limit and the embedding API call finishes in time.
  if (chunks.length > MAX_CHUNKS) {
    const kept = chunks.slice(0, MAX_CHUNKS - 1);
    const overflow = chunks.slice(MAX_CHUNKS - 1);
    const mergedContent = overflow.map((c) => c.content).join("\n\n");
    kept.push({
      chunkIndex: MAX_CHUNKS - 1,
      unitLabel: overflow[0]?.unitLabel || "General",
      pageStart: overflow[0]?.pageStart || kept[kept.length - 1]?.pageEnd || 1,
      pageEnd: overflow[overflow.length - 1]?.pageEnd || doc.pageCount || 1,
      content: mergedContent.trim(),
      tokenCount: estimateTokens(mergedContent),
    });
    return kept;
  }

  return chunks;
}

