import { promises as fs } from "fs";
import path from "path";
import type { Ranked } from "./select";

export async function writeJsonSet(trackSlug: string, difficulty: string, items: Ranked[]) {
  const dir = path.join(process.cwd(),   "data", trackSlug);
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `${difficulty.toLowerCase()}.json`);
  const payload = {
    frozen: true,
    createdAt: new Date().toISOString(),
    trackSlug,
    difficulty,
    questions: items.slice(0, 40).map(({ position, title, titleSlug, difficulty, acRate, likes, dislikes }) => ({
      position,
      title,
      slug: titleSlug,
      difficulty,
      acceptance: acRate,
      likes,
      dislikes
    }))
  };
  await fs.writeFile(file, JSON.stringify(payload, null, 2), "utf-8");
  return file;
}
