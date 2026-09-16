import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, "src", "data");
const target = path.join(dataDir, "cityQuestions.online.js");
const batch = path.join(dataDir, "cityQuestions.online.batch2.js");

const current = await fs.readFile(target, "utf8");
if (current.includes("// BATCH2_MERGED")) process.exit(0);

const batchSource = await fs.readFile(batch, "utf8");
const match = batchSource.match(/export const CITY_ONLINE_QUESTIONS_BATCH_2 = \[(.*)\];\s*$/s);
if (!match) throw new Error("Nije pronađen CITY_ONLINE_QUESTIONS_BATCH_2 u batch2 datoteci.");

const marker = "\n  // BATCH2_MERGED\n";
const close = current.lastIndexOf("];" );
if (close < 0) throw new Error("CITY_ONLINE_QUESTIONS niz nema završni ];");

const merged = current.slice(0, close) + "," + marker + match[1].trim() + "\n" + current.slice(close);
await fs.writeFile(target, merged, "utf8");
console.log("Merged city online supplement batch 2.");
