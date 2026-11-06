export interface MuPyqItem {
  subject: string;
  slug: string;
  year: string;
  session: string;
  scheme: string;
  isNep: boolean;
  pdfUrl: string;
  filename: string;
}

export type MuPyqBranchData = Record<string, MuPyqItem[]>;

/**
 * Loads question papers for a given branch
 */
export async function getBranchPyqs(branchId: string): Promise<MuPyqBranchData> {
  try {
    const data = await import(`./${branchId.toLowerCase()}.json`, { with: { type: "json" } });
    return (data.default || data) as MuPyqBranchData;
  } catch {
    return {};
  }
}

/**
 * Searches question papers by branch, semester, and optional subject query
 */
export async function findMuQuestionPapers(
  branch: string,
  semester?: number,
  query?: string
): Promise<MuPyqItem[]> {
  const branchData = await getBranchPyqs(branch);
  if (!branchData) return [];

  let pool: MuPyqItem[] = [];
  if (semester) {
    pool = branchData[`sem${semester}`] || [];
  } else {
    for (const semList of Object.values(branchData)) {
      pool.push(...semList);
    }
  }

  if (!query || query.trim().length === 0) {
    return pool;
  }

  const cleanQuery = query.toLowerCase().trim();
  return pool.filter(
    (p) =>
      p.subject.toLowerCase().includes(cleanQuery) ||
      p.slug.toLowerCase().includes(cleanQuery)
  );
}
