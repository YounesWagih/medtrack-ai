import { describe, it, expect, beforeEach, vi } from "vitest";
import { MedicineStatus } from "@prisma/client";

vi.mock("../repositories/medicine.repository.js", () => ({
  create: vi.fn(),
  findManyByUser: vi.fn(),
  countByUser: vi.fn(),
  findByIdForUser: vi.fn(),
  updateForUser: vi.fn(),
  markRemoved: vi.fn(),
  updateStatus: vi.fn(),
  findCandidatesForStatusSync: vi.fn(),
}));

import * as medicineRepo from "../repositories/medicine.repository.js";
import * as medicineService from "./medicine.service.js";

describe("MedicineService", () => {
  const mockUserId = "user-123";
  const mockMedicineId = "medicine-456";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createMedicine", () => {
    it("should create medicine with computed status for active medicine", async () => {
      const input = {
        name: "Aspirin",
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      };
      
      const mockMedicine = {
        id: mockMedicineId,
        userId: mockUserId,
        name: "Aspirin",
        expiryDate: input.expiryDate,
        status: MedicineStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (medicineRepo.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockMedicine);

      const result = await medicineService.createMedicine(mockUserId, input);

      expect(medicineRepo.create).toHaveBeenCalledWith(mockUserId, {
        name: input.name,
        expiryDate: input.expiryDate,
        status: MedicineStatus.ACTIVE,
      });
      expect(result).toEqual(mockMedicine);
    });

    it("should create medicine with EXPIRED status for expired medicine", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const input = {
        name: "Old Medicine",
        expiryDate: yesterday,
      };
      
      const mockMedicine = {
        id: mockMedicineId,
        userId: mockUserId,
        name: "Old Medicine",
        expiryDate: input.expiryDate,
        status: MedicineStatus.EXPIRED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (medicineRepo.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockMedicine);

      const result = await medicineService.createMedicine(mockUserId, input);

      expect(result.status).toBe(MedicineStatus.EXPIRED);
    });
  });

  describe("getMedicineById", () => {
    it("should return medicine when found", async () => {
      const mockMedicine = {
        id: mockMedicineId,
        userId: mockUserId,
        name: "Aspirin",
        expiryDate: new Date(),
        status: MedicineStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (medicineRepo.findByIdForUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockMedicine);

      const result = await medicineService.getMedicineById(mockUserId, mockMedicineId);

      expect(result).toEqual(mockMedicine);
    });

    it("should throw APIError when not found", async () => {
      (medicineRepo.findByIdForUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(medicineService.getMedicineById(mockUserId, mockMedicineId))
        .rejects.toThrow("Medicine with ID");
    });
  });

  describe("removeMedicine", () => {
    it("should soft-remove medicine", async () => {
      const existing = {
        id: mockMedicineId,
        userId: mockUserId,
        name: "Aspirin",
        expiryDate: new Date(),
        status: MedicineStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const removed = {
        ...existing,
        status: MedicineStatus.REMOVED,
      };

      (medicineRepo.findByIdForUser as ReturnType<typeof vi.fn>).mockResolvedValue(existing);
      (medicineRepo.markRemoved as ReturnType<typeof vi.fn>).mockResolvedValue(removed);

      const result = await medicineService.removeMedicine(mockUserId, mockMedicineId);

      expect(medicineRepo.markRemoved).toHaveBeenCalledWith(mockMedicineId, mockUserId);
      expect(result.status).toBe(MedicineStatus.REMOVED);
    });

    it("should return existing if already removed", async () => {
      const alreadyRemoved = {
        id: mockMedicineId,
        userId: mockUserId,
        name: "Aspirin",
        expiryDate: new Date(),
        status: MedicineStatus.REMOVED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (medicineRepo.findByIdForUser as ReturnType<typeof vi.fn>).mockResolvedValue(alreadyRemoved);

      const result = await medicineService.removeMedicine(mockUserId, mockMedicineId);

      expect(medicineRepo.markRemoved).not.toHaveBeenCalled();
      expect(result.status).toBe(MedicineStatus.REMOVED);
    });
  });
});