import { CouponDocument } from "../../types/coupon.js";
/**
 * Type guard to check if a raw object conforms to the CouponDocument shape.
 *
 * This function is used to ensure that Firestore documents or external data
 * have all the required fields to be treated as a valid `CouponDocument`.
 *
 * @param raw - The raw object to validate
 * @returns True if the object has all required fields of `CouponDocument`, false otherwise
 *
 * Required fields:
 * - siteId: string
 * - userId: string
 * - code: string
 * - discountType: "percentage" | "fixed"
 * - discountValue: number
 * - usedCount: number
 * - validFrom: string
 * - validUntil: string
 * - isActive: boolean
 * - createdAt: string
 * - updatedAt: string
 */
export const validateRawCouponData = (raw: any): raw is CouponDocument => {
  return !!(
    raw?.siteId &&
    raw?.userId &&
    raw?.code &&
    raw?.discountType &&
    raw?.discountValue !== undefined &&
    raw?.usedCount !== undefined &&
    raw?.validFrom &&
    raw?.validUntil &&
    raw?.isActive !== undefined &&
    raw?.createdAt &&
    raw?.updatedAt
  );
};
