import type { Feedback } from "./types";
import fs from "fs";
import path from "path";

const FEEDBACK_FILE = path.join(process.cwd(), "data", "feedback.json");

function ensureDataDir() {
  const dir = path.dirname(FEEDBACK_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readFeedback(): Feedback[] {
  ensureDataDir();
  if (!fs.existsSync(FEEDBACK_FILE)) {
    return [];
  }
  const raw = fs.readFileSync(FEEDBACK_FILE, "utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeFeedback(entries: Feedback[]) {
  ensureDataDir();
  fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

export function addFeedback(fb: Omit<Feedback, "id" | "timestamp">): Feedback {
  const entries = readFeedback();
  const newEntry: Feedback = {
    ...fb,
    id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
  };
  entries.push(newEntry);
  writeFeedback(entries);
  return newEntry;
}

export function getRecentFeedback(limit = 50): Feedback[] {
  const entries = readFeedback();
  return entries.slice(-limit).reverse();
}
