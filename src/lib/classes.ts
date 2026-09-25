/** Ready-made class lists the owner can add in one tap. */
export const CLASS_PRESETS = [
  { key: "1-12", label: "Class 1 to 12", names: Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`) },
  { key: "6-10", label: "Class 6 to 10", names: Array.from({ length: 5 }, (_, i) => `Class ${i + 6}`) },
  { key: "puc", label: "PUC 1 & 2", names: ["PUC 1", "PUC 2"] },
  { key: "entrance", label: "JEE / NEET", names: ["JEE", "NEET"] },
] as const;

/** Tidy a typed class name: trim and collapse spaces ("  class   10 " -> "class 10"). */
export function cleanClassName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/**
 * Which preset names are not in the list yet (case-insensitive), so tapping a
 * preset twice never creates duplicates.
 */
export function missingNames(existing: string[], wanted: readonly string[]): string[] {
  const have = new Set(existing.map((n) => n.toLowerCase()));
  return wanted.filter((n) => !have.has(n.toLowerCase()));
}

/** Natural sort: "Class 2" before "Class 10". */
export function compareClassNames(a: string, b: string): number {
  return a.localeCompare(b, "en", { numeric: true, sensitivity: "base" });
}

/** "10" -> "Class 10"; "Class 10", "PUC 1", "JEE" stay as they are. */
export function classLabel(value: string): string {
  const v = value.trim();
  return /^\d+(st|nd|rd|th)?$/i.test(v) ? `Class ${v}` : v;
}
