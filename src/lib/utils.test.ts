import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility function", () => {
  it("should merge class names correctly", () => {
    const result = cn("text-red-500", "bg-blue-500");
    expect(result).toBe("text-red-500 bg-blue-500");
  });

  it("should handle conditional classes", () => {
    const result = cn("base-class", true && "conditional-class");
    expect(result).toContain("base-class");
    expect(result).toContain("conditional-class");
  });

  it("should handle false conditional classes", () => {
    const result = cn("base-class", false && "conditional-class");
    expect(result).toBe("base-class");
  });

  it("should merge Tailwind classes correctly", () => {
    // twMerge should handle conflicting Tailwind classes
    const result = cn("px-2", "px-4");
    expect(result).toBe("px-4"); // Later class should override
  });

  it("should handle empty input", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("should handle undefined and null", () => {
    const result = cn("text-sm", undefined, null, "font-bold");
    expect(result).toContain("text-sm");
    expect(result).toContain("font-bold");
  });

  it("should handle arrays of classes", () => {
    const result = cn(["text-sm", "font-bold"], "text-red-500");
    expect(result).toContain("text-sm");
    expect(result).toContain("font-bold");
    expect(result).toContain("text-red-500");
  });
});
