import { describe, it, expect } from "vitest";
import { toUnit, toMilliunits } from "../currency.js";

describe("currency utilities", () => {
  describe("toUnit", () => {
    it("converts milliunits to currency amount", () => {
      expect(toUnit(1000)).toBe(1);
      expect(toUnit(50250)).toBe(50.25);
      expect(toUnit(-25000)).toBe(-25);
    });

    it("handles zero", () => {
      expect(toUnit(0)).toBe(0);
    });

    it("handles large numbers", () => {
      expect(toUnit(1000000000)).toBe(1000000);
    });

    it("handles fractional milliunits", () => {
      expect(toUnit(1500)).toBe(1.5);
      // Note: YNAB utility rounds to 2 decimal places for currency display
      expect(toUnit(1)).toBe(0);
      expect(toUnit(10)).toBe(0.01);
    });
  });

  describe("toMilliunits", () => {
    it("converts currency amount to milliunits", () => {
      expect(toMilliunits(1)).toBe(1000);
      expect(toMilliunits(50.25)).toBe(50250);
      expect(toMilliunits(-25)).toBe(-25000);
    });

    it("handles zero", () => {
      expect(toMilliunits(0)).toBe(0);
    });

    it("handles large numbers", () => {
      expect(toMilliunits(1000000)).toBe(1000000000);
    });

    it("rounds to nearest milliunit", () => {
      // 10.2556 * 1000 = 10255.6 -> rounds to 10256
      expect(toMilliunits(10.2556)).toBe(10256);
      // 10.2554 * 1000 = 10255.4 -> rounds to 10255
      expect(toMilliunits(10.2554)).toBe(10255);
    });
  });
});
