/** Tidy a typed class name: trim and collapse spaces ("  class   10 " -> "class 10"). */
export function cleanClassName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
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

/** Short badge text for a class tile: "Class 10" -> "10", "PUC 1" -> "PUC1", "JEE" -> "JEE", "Spoken English" -> "SE". */
export function classBadge(name: string): string {
  const v = name.trim();
  const numbered = /^(class|std|grade)\s*(\d+)/i.exec(v);
  if (numbered) return numbered[2];
  const words = v.split(/\s+/);
  if (words.length === 1) return v.slice(0, 4).toUpperCase();
  const digits = v.replace(/\D/g, "");
  if (digits) return (words[0].slice(0, 3) + digits.slice(0, 2)).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
}
