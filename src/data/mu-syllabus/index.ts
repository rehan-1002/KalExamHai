export * from "./catalog";

export interface SyllabusModule {
  moduleNo: number;
  title: string;
  topics: string[];
  hours?: number;
  weightageMarks: number;
}

export interface SyllabusSubject {
  code: string;
  name: string;
  shortName: string;
  semester: number;
  scheme: "NEP-2020" | "REV-2019";
  credits?: number;
  endSemMarks: number;
  iatMarks: number;
  totalMarks: number;
  modules: SyllabusModule[];
}

export interface BranchInfo {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  semesters: number[];
}

export const BRANCHES: BranchInfo[] = [
  { id: "fe", name: "First Year Engineering (Common)", shortName: "FE", icon: "📐", semesters: [1, 2] },
  { id: "comps", name: "Computer Engineering", shortName: "Comps", icon: "💻", semesters: [3, 4, 5, 6, 7, 8] },
  { id: "it", name: "Information Technology", shortName: "IT", icon: "🌐", semesters: [3, 4, 5, 6, 7, 8] },
  { id: "aids", name: "Artificial Intelligence & Data Science", shortName: "AIDS", icon: "📊", semesters: [3, 4, 5, 6, 7, 8] },
  { id: "aiml", name: "AI & Machine Learning", shortName: "AIML", icon: "🤖", semesters: [3, 4, 5, 6, 7, 8] },
  { id: "mech", name: "Mechanical Engineering", shortName: "Mech", icon: "⚙️", semesters: [3, 4, 5, 6, 7, 8] },
  { id: "electrical", name: "Electrical Engineering", shortName: "Electrical", icon: "⚡", semesters: [3, 4, 5, 6, 7, 8] },
  { id: "civil", name: "Civil Engineering", shortName: "Civil", icon: "🏗️", semesters: [3, 4, 5, 6, 7, 8] },
];

/**
 * Dynamically loads subjects for a given branch and optional semester.
 */
export async function getBranchSubjects(branchId: string, semester?: number): Promise<SyllabusSubject[]> {
  try {
    // Dynamic import of the branch JSON
    const data = await import(`./${branchId}.json`, { with: { type: "json" } });
    const subjects: SyllabusSubject[] = data.default || data;
    if (semester) {
      return subjects.filter((s) => s.semester === semester);
    }
    return subjects;
  } catch {
    return [];
  }
}

/**
 * Searches across all preloaded branches for a subject by code or name.
 */
export async function findSubject(query: string): Promise<{ subject: SyllabusSubject; branch: BranchInfo } | null> {
  const q = query.trim().toLowerCase();
  for (const branch of BRANCHES) {
    const subjects = await getBranchSubjects(branch.id);
    const found = subjects.find(
      (s) =>
        s.code.toLowerCase() === q ||
        s.shortName.toLowerCase() === q ||
        s.name.toLowerCase().includes(q)
    );
    if (found) {
      return { subject: found, branch };
    }
  }
  return null;
}

/**
 * Formats a subject's official syllabus into a clean text block
 * that can be injected directly into Gemini exam generation prompts.
 */
export function formatSubjectSyllabusText(subject: SyllabusSubject): string {
  const lines: string[] = [
    `Course: ${subject.name} (${subject.code}) - Semester ${subject.semester}`,
    `Scheme: ${subject.scheme} | End-Sem Marks: ${subject.endSemMarks} | IAT Marks: ${subject.iatMarks}`,
    "",
    "DETAILED MODULE-WISE SYLLABUS:",
  ];

  subject.modules.forEach((mod) => {
    lines.push(`\n[Module ${mod.moduleNo}: ${mod.title}] (Expected Marks: ~${mod.weightageMarks}M, Hours: ${mod.hours || "N/A"})`);
    mod.topics.forEach((topic) => {
      lines.push(`• ${topic}`);
    });
  });

  return lines.join("\n");
}

