/**
 * Converts structured paper / survival kit data into a 100% natural,
 * conversational "Bro Tone / Senior Topper" monologue for Mumbai University students.
 */

interface BroTopic {
  title: string;
  module_name?: string;
  expected_marks?: number | string;
  summary_points?: string[];
  must_draw_diagram?: string;
}

interface BroPaperQuestion {
  no: number;
  compulsory?: boolean;
  total_marks?: number;
  sub_questions?: Array<{ label: string; text: string; marks: number }>;
}

export function buildSurvivalKitBroScript(
  subject: string,
  topics: BroTopic[],
  checklist: string[] = []
): string {
  const topTopics = topics.slice(0, 4);

  const scriptParts: string[] = [];

  // 1. Warm, relatable Bro Hook
  scriptParts.push(
    `Suno bhai! Agar kal tumhara ${subject} ka paper hai aur thodi tension ho rahi hai, toh bilkul panic mat karo. Agle do minute dhyan se suno, sab sort ho jayega.`
  );

  // 2. NEP Passing Strategy
  scriptParts.push(
    `Mumbai University ke NEP-2020 pattern mein passing mark 24 out of 60 hai. Hamara goal hai ki pehle 30 se 35 marks ekdum secure kar lein, taaki KT ka koi chance hi na rahe.`
  );

  // 3. High-Yield Topics breakdown in conversational Hindi-English
  if (topTopics.length > 0) {
    scriptParts.push(`Ab aate hain high-weightage topics par.`);

    topTopics.forEach((t, i) => {
      const rankWords = ["Sabse pehle", "Doosra topic", "Teesra main topic", "Chautha topic"];
      const prefix = rankWords[i] || `Topic number ${i + 1}`;
      const marksStr = t.expected_marks ? `Ye kareeb ${t.expected_marks} marks carry karta hai.` : "";
      const diagramAdvice = t.must_draw_diagram
        ? `Isme diagram zaroor banana: ${t.must_draw_diagram}. MU ke examiner diagram dekh kar full marks dete hain.`
        : "Isme point-wise steps aur clean handwriting maintain karna.";

      const pointsSnippet = t.summary_points && t.summary_points.length > 0
        ? `Main points yaad rakhna: ${t.summary_points.slice(0, 2).join(". ")}.`
        : "";

      scriptParts.push(
        `${prefix} uthana: ${t.title}${t.module_name ? ` jo ${t.module_name} se hai` : ""}. ${marksStr} ${pointsSnippet} ${diagramAdvice}`
      );
    });
  }

  // 4. Checklist & Exam Hall Rules
  if (checklist.length > 0) {
    const keyItems = checklist.slice(0, 3).join(". ");
    scriptParts.push(
      `Aur exam hall jane se pehle ye teen cheezein pakka check kar lena: ${keyItems}.`
    );
  }

  // 5. Final Motivation & Sign-off
  scriptParts.push(
    `Question 1 ke compulsory 5-mark short notes bilkul mat chhodna. Kuch na kuch relevant formula ya block diagram daal kar aana. Pure confidence ke sath likhna bhai, kal paper fod ke aaoge. All the best!`
  );

  return scriptParts.join(" ");
}

export function buildPaperBroScript(
  subject: string,
  examTitle: string,
  durationMinutes: number,
  totalMarks: number,
  questions: BroPaperQuestion[]
): string {
  const scriptParts: string[] = [];

  scriptParts.push(
    `Haan bhai, suno! Ye raha tumhara ${subject} ka complete paper walkthrough.`
  );

  scriptParts.push(
    `Total duration ${durationMinutes} minutes hai, aur maximum marks ${totalMarks} marks ka paper hai. Time management bohot zaroori hai.`
  );

  // Compulsory Q1
  const q1 = questions.find((q) => q.no === 1);
  if (q1 && q1.sub_questions && q1.sub_questions.length > 0) {
    scriptParts.push(
      `Question 1 compulsory hai. Isme 5-5 marks ke short questions aayenge. Har answer mein kam se kam aadha page likhna, formula box karna aur simple diagram daalna. Isse seedhe 15 se 20 marks confirm ho jate hain.`
    );
  }

  // Next big numerical / derivation questions
  const bigQuestions = questions.filter((q) => q.no > 1).slice(0, 3);
  if (bigQuestions.length > 0) {
    scriptParts.push(`Uske baad baki questions mein se wo solve karna jisme numericals ya standard derivations hon:`);

    bigQuestions.forEach((q) => {
      if (q.sub_questions && q.sub_questions.length > 0) {
        const sq = q.sub_questions[0];
        scriptParts.push(
          `Question ${q.no} mein jaise ${sq.text} hai. Ye ${sq.marks} marks ka high yield question hai. Step by step solve karna.`
        );
      }
    });
  }

  scriptParts.push(
    `Har answer ko neat headings ke sath likho. Overwriting mat karo. All the best bhai, aaram se pass ho jaoge aur score bhi tagda banega!`
  );

  return scriptParts.join(" ");
}
