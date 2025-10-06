import type { ProblemListItem } from "./leetcode";

export type Ranked = ProblemListItem & {
  likes?: number;
  dislikes?: number;
  popularity?: number;
  votes?: number;
  position?: number;
};

export function rankFull(list: (ProblemListItem & { likes: number; dislikes: number })[]): Ranked[] {
  const withScores = list.map(q => ({
    ...q,
    popularity: (q.likes ?? 0) - (q.dislikes ?? 0),
    votes: (q.likes ?? 0) + (q.dislikes ?? 0)
  }));
  const filtered = withScores.filter(q => (q.votes ?? 0) >= 50);
  const pool = filtered.length >= 40 ? filtered : withScores;
  return pool
    .sort((a, b) =>
      ((b.popularity ?? 0) - (a.popularity ?? 0)) ||
      (b.acRate - a.acRate) ||
      ((parseInt(a.frontendQuestionId ?? "0") || 0) - (parseInt(b.frontendQuestionId ?? "0") || 0))
    )
    .map((q, i) => ({ ...q, position: i + 1 }));
}
