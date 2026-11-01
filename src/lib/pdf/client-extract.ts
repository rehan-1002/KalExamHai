export interface ClientExtractedText {
  text: string;
  pageCount: number;
}

/**
 * Extracts plain text from a PDF File directly inside the client's browser/PWA.
 * Runs in under ~400ms on mobile devices and bypasses cloud serverless timeouts.
 */
export async function extractTextFromPdfClient(file: File): Promise<ClientExtractedText> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjs = await import("pdfjs-dist");

    if (typeof window !== "undefined") {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    }

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      isEvalSupported: false,
    });

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((item: any) => ("str" in item ? item.str : ""))
          .join(" ")
          .trim();

        if (pageText) {
          pageTexts.push(`[Page ${pageNum}]\n${pageText}`);
        }
      } catch (pageErr) {
        console.warn(`[ClientPDF] Failed to extract page ${pageNum}:`, pageErr);
      }
    }

    const fullText = pageTexts.join("\n\n").trim();

    return {
      text: fullText,
      pageCount: Math.max(1, numPages),
    };
  } catch (err) {
    console.warn("[ClientPDF] Client extraction failed or not supported:", err);
    return {
      text: "",
      pageCount: 1,
    };
  }
}
