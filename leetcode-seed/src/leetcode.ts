import fetch from "cross-fetch";

export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type ProblemListItem = {
  title: string;
  titleSlug: string;
  difficulty: Difficulty;
  acRate: number;
  isPaidOnly: boolean;
  frontendQuestionId?: string;
  topicTags?: { name: string; slug: string }[];
};

const LIST_QUERY = `
query problemsetQuestionList($categorySlug: String, $skip: Int, $limit: Int, $filters: QuestionListFilterInput) {
  problemsetQuestionList: questionList(
    categorySlug: $categorySlug
    limit: $limit
    skip: $skip
    filters: $filters
  ) {
    total: totalNum
    questions: data {
      acRate
      difficulty
      questionFrontendId
      isPaidOnly
      title
      titleSlug
      topicTags { name slug }
    }
  }
}
`;

const QUESTION_DATA = `
query questionData($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    title
    titleSlug
    difficulty
    likes
    dislikes
    isPaidOnly
  }
}
`;

export async function fetchProblemListByTag(tagSlug: string, difficulty: Difficulty, includePremium: boolean) {
  const base = process.env.LEETCODE_BASE ?? "https://leetcode.com/graphql";
  const pageSize = 50;
  let skip = 0;
  let total = Infinity;
  const out: ProblemListItem[] = [];
  while (skip < total) {
    const res = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "PrepVerseSeeder/1.0" },
      body: JSON.stringify({
        query: LIST_QUERY,
        variables: { categorySlug: "", skip, limit: pageSize, filters: { difficulty, tags: [tagSlug] } }
      })
    });
    const json = await res.json();
    const data = json?.data?.problemsetQuestionList;
    if (!data) break;
    total = data.total ?? 0;
    const batch: ProblemListItem[] = (data.questions ?? []).map((q: any) => ({
      title: q.title,
      titleSlug: q.titleSlug,
      difficulty: q.difficulty,
      acRate: q.acRate,
      isPaidOnly: q.isPaidOnly,
      frontendQuestionId: q.questionFrontendId,
      topicTags: q.topicTags
    }));
    out.push(...batch.filter(q => includePremium ? true : !q.isPaidOnly));
    skip += pageSize;
    await new Promise(r => setTimeout(r, 250));
  }
  return out;
}

export async function fetchQuestionPopularity(slug: string) {
  const base = process.env.LEETCODE_BASE ?? "https://leetcode.com/graphql";
  const res = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "PrepVerseSeeder/1.0" },
    body: JSON.stringify({ query: QUESTION_DATA, variables: { titleSlug: slug } })
  });
  const json = await res.json();
  const q = json?.data?.question;
  const likes = q?.likes ?? 0;
  const dislikes = q?.dislikes ?? 0;
  const paid = q?.isPaidOnly ?? false;
  return { likes, dislikes, isPaidOnly: paid };
}
