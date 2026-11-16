import { NextRequest, NextResponse } from "next/server";
import { generateBroAudioBriefing } from "@/server/audio/briefing";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subject, title, content } = body;

    if (!subject || !content) {
      return NextResponse.json(
        { ok: false, error: "Subject and content are required" },
        { status: 400 }
      );
    }

    const script = await generateBroAudioBriefing({
      subject,
      title,
      content,
    });

    return NextResponse.json({ ok: true, script });
  } catch (err) {
    console.error("Audio briefing route error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to generate audio script" },
      { status: 500 }
    );
  }
}
