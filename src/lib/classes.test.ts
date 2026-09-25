import { describe, expect, it } from "vitest";
import { classBadge, classLabel, cleanClassName, compareClassNames } from "./classes";

describe("class helpers", () => {
  it("cleans typed names", () => {
    expect(cleanClassName("  Class   10  ")).toBe("Class 10");
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

describe("classBadge", () => {
  it("makes short tile badges", () => {
    expect(classBadge("Class 10")).toBe("10");
    expect(classBadge("Class 10 (CBSE)")).toBe("10");
    expect(classBadge("PUC 1")).toBe("PUC1");
    expect(classBadge("JEE")).toBe("JEE");
    expect(classBadge("Spoken English")).toBe("SE");
  });
});
