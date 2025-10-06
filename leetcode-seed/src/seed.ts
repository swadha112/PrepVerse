import "dotenv/config";
import { promises as fs } from "fs";
import path from "path";
import { TRACKS } from "./topics";
import { fetchProblemListByTag, fetchQuestionPopularity, type Difficulty } from "./leetcode";
import { rankFull } from "./select";
import { writeJsonSet } from "./store-json";

const DIFFS: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

async function seedOne(trackSlug: string, difficulty: Difficulty) {
  const outPath = path.join(process.cwd(),  "leetcode-seed", "data", trackSlug, `${difficulty.toLowerCase()}.json`);
  try {
    await fs.access(outPath);
    throw new Error(`Frozen set exists: ${outPath}`);
  } catch {}
  const includePremium = (process.env.INCLUDE_PREMIUM ?? "false") === "true";
  const baseList = await fetchProblemListByTag(trackSlug, difficulty, includePremium);
  const enriched = await Promise.all(
    baseList.map(async (q) => {
      const { likes, dislikes, isPaidOnly } = await fetchQuestionPopularity(q.titleSlug);
      if (!includePremium && isPaidOnly) return null;
      return { ...q, likes, dislikes };
    })
  );
  const ranked = rankFull((enriched.filter(Boolean) as any[])).slice(0, 40);
  const saved = await writeJsonSet(trackSlug, difficulty, ranked);
  console.log("Saved:", saved);
}

async function main() {
  for (const t of TRACKS) {
    for (const d of DIFFS) {
      console.log(`Seeding ${t.slug} / ${d}`);
      await seedOne(t.slug, d);
    }
  }
  console.log("Done.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
