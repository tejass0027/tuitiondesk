import { describe, expect, it } from "vitest";
import { PAGE_SIZE, pageSize } from "./paging";

describe("pageSize", () => {
  it("defaults to one page", () => {
    expect(pageSize(undefined)).toBe(PAGE_SIZE);
    expect(pageSize("abc")).toBe(PAGE_SIZE);
    expect(pageSize("0")).toBe(PAGE_SIZE);
    expect(pageSize(["100"])).toBe(100);
  });
  it("rounds up to whole pages and caps the total", () => {
    expect(pageSize("100")).toBe(100);
    expect(pageSize("120")).toBe(150);
    expect(pageSize("999999")).toBe(2000);
  });
});
