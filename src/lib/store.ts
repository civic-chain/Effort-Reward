/**
 * Storage for inquiries and tallies.
 *
 * - Firebase configured  → each inquiry is saved to `inquiries`, and the shared
 *   counters in `stats/tallies` are incremented in the same atomic batch.
 * - Firebase NOT configured → demo mode: tallies live in this browser's
 *   localStorage only (so the form and stats page still work end to end).
 *
 * Counters are flat fields (see `tallyKeys` in inquiry.ts) so Firestore's
 * `increment()` can bump them without reading first.
 */
import { collection, doc, getDoc, increment, serverTimestamp, writeBatch } from "firebase/firestore";
import { firebaseEnabled, getDb } from "./firebase";
import { tallyKeys, type InquiryInput, type Tallies } from "./inquiry";

export { firebaseEnabled };

export type StoreMode = "cloud" | "local";

const LOCAL_KEY = "cc-onboard-tallies";

function readLocal(): Tallies {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as Tallies) : {};
  } catch {
    return {};
  }
}

function writeLocal(t: Tallies) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(t));
  } catch {
    /* storage blocked (private window etc.) — demo tallies just won't persist */
  }
}

/** Saves one inquiry and bumps its tallies. Throws if the cloud write fails. */
export async function recordInquiry(input: InquiryInput): Promise<StoreMode> {
  const keys = tallyKeys(input);

  if (!firebaseEnabled) {
    const t = readLocal();
    for (const k of keys) t[k] = (t[k] ?? 0) + 1;
    writeLocal(t);
    return "local";
  }

  const db = getDb();
  const batch = writeBatch(db);

  batch.set(doc(collection(db, "inquiries")), {
    createdAt: serverTimestamp(),
    name: input.name.trim(),
    email: input.email.trim(),
    organization: input.organization.trim(),
    country: input.country,
    state: input.country === "United States" ? input.state : "",
    attendedCouncil: input.attendedCouncil,
    source: input.source,
  });

  const counters: Record<string, ReturnType<typeof increment>> = {};
  for (const k of keys) counters[k] = increment(1);
  batch.set(doc(db, "stats", "tallies"), counters, { merge: true });

  await batch.commit();
  return "cloud";
}

/** Current tallies (empty object if nothing has been recorded yet). */
export async function loadTallies(): Promise<{ tallies: Tallies; mode: StoreMode }> {
  if (!firebaseEnabled) return { tallies: readLocal(), mode: "local" };
  const snap = await getDoc(doc(getDb(), "stats", "tallies"));
  return { tallies: (snap.exists() ? snap.data() : {}) as Tallies, mode: "cloud" };
}
