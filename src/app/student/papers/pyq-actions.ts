"use server";

import { findMuQuestionPapers, type MuPyqItem } from "@/data/mu-pyqs";

export async function fetchMuPastPapersAction(
  branch: string,
  semester?: number,
  query?: string,
  nepOnly?: boolean
): Promise<{ ok: boolean; papers: MuPyqItem[]; totalCount: number }> {
  try {
    let papers = await findMuQuestionPapers(branch, semester, query);
    if (nepOnly) {
      papers = papers.filter((p) => p.isNep);
    }
    return { ok: true, papers: papers.slice(0, 150), totalCount: papers.length };
  } catch {
    return { ok: false, papers: [], totalCount: 0 };
  }
}

