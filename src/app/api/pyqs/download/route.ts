import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pdfUrl = searchParams.get("url");
  const rawName = searchParams.get("filename") || "Mumbai_University_Question_Paper.pdf";

  if (!pdfUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    const parsed = new URL(pdfUrl);
    const allowed = ["www.munotes.in", "munotes.in", "muquestionpapers.com"];
    if (!allowed.includes(parsed.hostname)) {
      return new NextResponse("Invalid upstream host", { status: 403 });
    }

    const upstream = await fetch(pdfUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        Accept: "application/pdf,*/*",
      },
    });

    if (!upstream.ok) {
      return new NextResponse("PDF not found on upstream server", { status: upstream.status });
    }

    const contentType = upstream.headers.get("content-type") || "application/pdf";
    const arrayBuffer = await upstream.arrayBuffer();

    // Sanitize filename to ensure clean .pdf extension
    let cleanName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_");
    if (!cleanName.toLowerCase().endsWith(".pdf")) {
      cleanName += ".pdf";
    }

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType.includes("pdf") ? "application/pdf" : contentType,
        "Content-Disposition": `attachment; filename="${cleanName}"`,
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch {
    return new NextResponse("Internal server error downloading PDF", { status: 500 });
  }
}
