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
