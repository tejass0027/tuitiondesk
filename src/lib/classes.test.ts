import { describe, expect, it } from "vitest";
import { classLabel, cleanClassName, compareClassNames } from "./classes";

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
