import { CouponDocument } from "../../types/coupon.js";
import { isWithinDateRange } from "./utils.js";

/**
 * Result type for validating a coupon against business rules.
 */
export type CouponValidationResult =
  | { status: "valid"; coupon: CouponDocument }
  | { status: "not-found" }
  | { status: "inactive" }
  | { status: "expired" }
  | { status: "limit-reached" }
  | { status: "not-authorized" }
  | { status: "order-not-found" }
  | { status: "invalid-order" }
  | { status: "already-applied" }
  | { status: "min-purchase-not-met" }
  | { status: "min-purchase-not-met"; minPurchase: number }
  | { status: "invalid-data"; message: string };
/**
 * Validates a coupon against core business rules.
 *
 * Checks performed:
 * 1. Coupon is active
 * 2. Current date is within validFrom and validUntil
 * 3. Maximum uses have not been exceeded
 * 4. Cart total meets the minimum purchase requirement (if provided)
 * 5. Percentage discounts do not exceed 100%
 * 6. Date range is valid (validFrom < validUntil)
 *
 * @param coupon - CouponDocument to validate
 * @param cartTotal - Optional cart total to validate minPurchase rule
 * @returns A CouponValidationResult describing the validation outcome
 */
export const validateCouponBusinessRules = (
  coupon: CouponDocument,
  cartTotal?: number,
): CouponValidationResult => {
  if (!coupon.isActive) return { status: "inactive" };

  if (!isWithinDateRange(coupon.validFrom, coupon.validUntil))
    return { status: "expired" };
  if (coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses)
    return { status: "limit-reached" };

  if (
    cartTotal !== undefined &&
    coupon.minPurchase !== undefined &&
    cartTotal < coupon.minPurchase
  ) {
    return { status: "min-purchase-not-met", minPurchase: coupon.minPurchase };
  }

  if (coupon.discountType === "percentage" && coupon.discountValue > 100) {
    return { status: "invalid-data", message: "Percentage cannot exceed 100" };
  }

  if (new Date(coupon.validFrom) >= new Date(coupon.validUntil)) {
    return { status: "invalid-data", message: "Invalid date range" };
  }

  return { status: "valid", coupon };
};

/**
 * Result type when applying a coupon within a transaction.
 */
export type ApplyTransactionResult =
  | { status: "applied" }
  | {
      status:
        | "valid"
        | "inactive"
        | "limit-reached"
        | "expired"
        | "not-found"
        | "invalid-data";
      message?: string;
      minPurchase?: number;
    };

/**
 * Validates the raw input data of a coupon before creation or update.
 *
 * @param coupon - Object containing key coupon fields to validate
 * @param discountType - "percentage" or "fixed"
 * @param discountValue - Numeric value of the discount
 * @param validFrom - ISO date string for start of validity
 * @param validUntil - ISO date string for end of validity
 * @returns null if input is valid, or a string describing the error
 */
export const validateCouponInput = (coupon: {
  discountType: string;
  discountValue: number;
  validFrom: string;
  validUntil: string;
}) => {
  if (coupon.discountType === "percentage" && coupon.discountValue > 100) {
    return "Percentage cannot exceed 100";
  }
  if (new Date(coupon.validFrom) >= new Date(coupon.validUntil)) {
    return "Invalid date range";
  }
  return null;
};
