import { MedicineStatus } from "@prisma/client";
import { env } from "../config/env.js";

export function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getEndOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function isExpired(expiryDate: Date): boolean {
  const today = getStartOfDay(new Date());
  const exp = getStartOfDay(expiryDate);
  return exp < today;
}

export function isExpiringSoon(expiryDate: Date, thresholdDays?: number): boolean {
  const threshold = env.MEDICINE_EXPIRING_SOON_DAYS;
  const today = getStartOfDay(new Date());
  const exp = getStartOfDay(expiryDate);
  
  if (exp < today) {
    return false;
  }
  
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + threshold);
  
  return exp <= futureDate;
}

export function computeStatus(expiryDate: Date): MedicineStatus {
  if (isExpired(expiryDate)) {
    return MedicineStatus.EXPIRED;
  }
  
  if (isExpiringSoon(expiryDate)) {
    return MedicineStatus.EXPIRING_SOON;
  }
  
  return MedicineStatus.ACTIVE;
}
