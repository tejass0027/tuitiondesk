import { describe, expect, it } from "vitest";
import { isOwnPhotoPath } from "./photos";

describe("isOwnPhotoPath", () => {
  const c = "bc88bbfc-0a84-499a-9e13-5ad8dc3021a0";
  const s = "72e60423-8281-4c3f-87ba-35d7622fd04b";
  it("accepts this student's photo in this centre's folder", () => {
    expect(isOwnPhotoPath(`${c}/${s}-1790497539486.jpg`, c, s)).toBe(true);
  });
  it("rejects other folders, other students and odd names", () => {
    expect(isOwnPhotoPath(`other/${s}-1790497539486.jpg`, c, s)).toBe(false);
    expect(isOwnPhotoPath(`${c}/someone-1790497539486.jpg`, c, s)).toBe(false);
    expect(isOwnPhotoPath(`${c}/${s}-1790497539486.png`, c, s)).toBe(false);
    expect(isOwnPhotoPath(`${c}/${s}-abc.jpg`, c, s)).toBe(false);
  });
});
