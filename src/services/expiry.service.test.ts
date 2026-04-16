import { describe, it, expect, beforeEach } from "vitest";
import { isExpired, isExpiringSoon, computeStatus } from "./expiry.service.js";
import { MedicineStatus } from "@prisma/client";

describe("ExpiryService", () => {
  describe("isExpired", () => {
    it("should return true for yesterday", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isExpired(yesterday)).toBe(true);
    });

    it("should return false for today", () => {
      const today = new Date();
      expect(isExpired(today)).toBe(false);
    });

    it("should return false for tomorrow", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isExpired(tomorrow)).toBe(false);
    });
  });

  describe("isExpiringSoon", () => {
    it("should return false for expired date", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isExpiringSoon(yesterday, 30)).toBe(false);
    });

    it("should return true for today when threshold is 30", () => {
      const today = new Date();
      expect(isExpiringSoon(today, 30)).toBe(true);
    });

    it("should return true for date within threshold", () => {
      const inTenDays = new Date();
      inTenDays.setDate(inTenDays.getDate() + 10);
      expect(isExpiringSoon(inTenDays, 30)).toBe(true);
    });

    it("should return false for date beyond threshold", () => {
      const inFortyDays = new Date();
      inFortyDays.setDate(inFortyDays.getDate() + 40);
      expect(isExpiringSoon(inFortyDays, 30)).toBe(false);
    });
  });

  describe("computeStatus", () => {
    it("should return EXPIRED for expired date", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(computeStatus(yesterday)).toBe(MedicineStatus.EXPIRED);
    });

    it("should return EXPIRING_SOON for today", () => {
      const today = new Date();
      expect(computeStatus(today)).toBe(MedicineStatus.EXPIRING_SOON);
    });

    it("should return EXPIRING_SOON for date within threshold", () => {
      const inFifteenDays = new Date();
      inFifteenDays.setDate(inFifteenDays.getDate() + 15);
      expect(computeStatus(inFifteenDays)).toBe(MedicineStatus.EXPIRING_SOON);
    });

    it("should return ACTIVE for date beyond threshold", () => {
      const inSixtyDays = new Date();
      inSixtyDays.setDate(inSixtyDays.getDate() + 60);
      expect(computeStatus(inSixtyDays)).toBe(MedicineStatus.ACTIVE);
    });
  });
});