import { describe, expect, it } from "vitest";
import { CLASS_PRESETS, classLabel, cleanClassName, compareClassNames, missingNames } from "./classes";

describe("class helpers", () => {
  it("has Class 1 to 12 as a preset", () => {
    expect(CLASS_PRESETS[0].names).toHaveLength(12);
    expect(CLASS_PRESETS[0].names[11]).toBe("Class 12");
  });
  it("cleans typed names", () => {
    expect(cleanClassName("  Class   10  ")).toBe("Class 10");
  });
  it("only adds preset names that are missing", () => {
    expect(missingNames(["class 1", "Class 2"], ["Class 1", "Class 2", "Class 3"])).toEqual(["Class 3"]);
  });
  it("sorts numbers naturally", () => {
    expect(["Class 10", "Class 2", "Class 1"].sort(compareClassNames)).toEqual(["Class 1", "Class 2", "Class 10"]);
  });
});

describe("classLabel", () => {
  it("adds 'Class' only to bare numbers", () => {
    expect(classLabel("10")).toBe("Class 10");
    expect(classLabel("10th")).toBe("Class 10th");
    expect(classLabel("Class 10")).toBe("Class 10");
    expect(classLabel("PUC 1")).toBe("PUC 1");
  });
});
