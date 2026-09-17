import fs from "node:fs/promises";
import path from "node:path";
const dataDir = path.join(process.cwd(), "src", "data");
const target = path.join(dataDir, "cityQuestions.online.js");
let merged = await fs.readFile(target, "utf8");
for (const batch of [
  { file: "cityQuestions.online.batch2.js", marker: "// BATCH2_MERGED", exportName: "CITY_ONLINE_QUESTIONS_BATCH_2" },
  { file: "cityQuestions.online.batch3.js", marker: "// BATCH3_MERGED", exportName: "CITY_ONLINE_QUESTIONS_BATCH_3" },
  { file: "cityQuestions.online.batch4.js", marker: "// BATCH4_MERGED", exportName: "CITY_ONLINE_QUESTIONS_BATCH_4" },
  { file: "cityQuestions.online.batch5.js", marker: "// BATCH5_MERGED", exportName: "CITY_ONLINE_QUESTIONS_BATCH_5" },
]) {
  if (merged.includes(batch.marker)) continue;
  const source = await fs.readFile(path.join(dataDir, batch.file), "utf8");
  const start = source.indexOf(`export const ${batch.exportName} = [`);
  const arrayStart = source.indexOf("[", start);
  const arrayEnd = source.lastIndexOf("];" );
  if (start < 0 || arrayStart < 0 || arrayEnd < arrayStart) throw new Error(`Neispravan ${batch.file}`);
  const items = source.slice(arrayStart + 1, arrayEnd).trim();
  const close = merged.lastIndexOf("];" );
  if (close < 0) throw new Error("CITY_ONLINE_QUESTIONS niz nema završni ];");
  merged = merged.slice(0, close) + ",\n  " + batch.marker + "\n" + items + "\n" + merged.slice(close);
}
const current = await fs.readFile(target, "utf8");
if (merged !== current) await fs.writeFile(target, merged, "utf8");
