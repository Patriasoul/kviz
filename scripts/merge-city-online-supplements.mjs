import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, "src", "data");
const target = path.join(dataDir, "cityQuestions.online.js");

let merged = await fs.readFile(target, "utf8");

const batches = [
  { file: "cityQuestions.online.batch2.js", marker: "// BATCH2_MERGED", exportName: "CITY_ONLINE_QUESTIONS_BATCH_2" },
  { file: "cityQuestions.online.batch3.js", marker: "// BATCH3_MERGED", exportName: "CITY_ONLINE_QUESTIONS_BATCH_3" },
];

for (const batch of batches) {
  if (merged.includes(batch.marker)) continue;
  const batchSource = await fs.readFile(path.join(dataDir, batch.file), "utf8");
  const start = batchSource.indexOf(`export const ${batch.exportName} = [`);
  if (start < 0) throw new Error(`Nije pronađen ${batch.exportName} u ${batch.file}.`);
  const arrayStart = batchSource.indexOf("[", start);
  const arrayEnd = batchSource.lastIndexOf("];" );
  if (arrayStart < 0 || arrayEnd < arrayStart) throw new Error(`Neispravan niz u ${batch.file}.`);
  const items = batchSource.slice(arrayStart + 1, arrayEnd).trim();
  const close = merged.lastIndexOf("];" );
  if (close < 0) throw new Error("CITY_ONLINE_QUESTIONS niz nema završni ];");
  merged = merged.slice(0, close) + ",\n  " + batch.marker + "\n" + items + "\n" + merged.slice(close);
}

const current = await fs.readFile(target, "utf8");
if (merged !== current) {
  await fs.writeFile(target, merged, "utf8");
  console.log("Merged pending city online supplement batches.");
} else {
  console.log("No pending city online supplement batches.");
}
