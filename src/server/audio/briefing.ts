import "server-only";
import { getGeminiClient, getGenerationModel } from "@/server/gemini/client";

/**
 * Generates an authentic, human, 60-90 second "Senior Topper Bro Tone" audio monologue
 * specifically tailored for Mumbai University engineering students.
 *
 * This turns raw formula lists, syllabus points, and papers into a crystal-clear,
 * highly actionable conversational briefing that sounds like a smart college friend
 * explaining how to clear the paper on the local train commute.
 */
export async function generateBroAudioBriefing(params: {
  subject: string;
  title?: string;
  content: string;
}): Promise<string> {
  const ai = getGeminiClient();
  const model = getGenerationModel();

  const prompt = `You are a street-smart, friendly Mumbai University engineering topper talking directly to a stressed junior through earphones while travelling in a Mumbai local train on exam morning.

Subject: "${params.subject}"
Study Material Title: "${params.title || "Exam Prep Material"}"
Content / Topics:
"""
${params.content.slice(0, 4000)}
"""

Task: Write a natural, highly engaging, 60 to 75-second spoken audio briefing in authentic Mumbai college Hinglish (Bro tone: "Suno bhai...", "chill maaro...", "examiner seedhe marks dega...").

STRICT RULES FOR HIGH AUDIO QUALITY:
1. NEVER EVER read out mathematical equations, LaTeX symbols (no backslashes, no lambdas, no carets, no integrals), dashes, markdown hashes, or bullet points!
2. Instead, tell the student WHAT topics to focus on, HOW the question actually appears in the exam, which trick to apply (e.g. "Cayley-Hamilton mein matrix A substitute karna mat bhoolna", "Fourier mein pehle even-odd check kar lena", "diagram zaroor pencil se banana"), and how to secure the passing 24 marks first.
3. Be specific to the actual topics in this material. Don't be generic or vague. Mention 3-4 exact key topics and their exam tricks.
4. Keep the pacing conversational with natural commas and short punchy sentences so text-to-speech speaks smoothly.
5. End with real bro-energy motivation ("Bhai kal paper fod ke aana, all the best!").
6. Output ONLY the spoken words. Do NOT include stage directions, speaker labels, asterisks, or quotes.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    });

    const script = response.text?.trim();
    if (!script || script.length < 50) {
      throw new Error("Briefing generation returned empty output");
    }

    // Clean any remaining markdown artifacts
    return script
      .replace(/[*#`_~]/g, "")
      .replace(/\[.*?\]/g, "")
      .replace(/--+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch (err) {
    console.warn("Failed to generate AI bro audio briefing, falling back to smart template:", err);
    // Dynamic clean fallback that never outputs formulas
    return `Suno bhai! Agar kal tumhara ${params.subject} ka paper hai toh bilkul chill maaro. Mumbai University ke NEP pattern mein sabse pehle 24 marks safe karna priority hai. Is sheet mein jo main high-yield topics hain, unke standard steps aur diagrams pehle revise karo. Question 1 ke compulsory short notes bilkul mat chhodna. Full confidence se likhna bhai, all the best!`;
  }
}
