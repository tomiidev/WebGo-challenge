import { CouponValidationResult } from "../../types/coupons/applyTypes.js";

/**
 * Returns a validation result indicating that the coupon was not found in the database.
 */
export const couponNotFound = (): CouponValidationResult => ({
  status: "not-found",
});

/**
 * Returns a validation result indicating that the coupon data is invalid or malformed.
 */
export const couponInvalidData = (): CouponValidationResult => ({
  status: "invalid-data",
  message: "Invalid coupon data in database",
});

/**
 * Returns a validation result indicating that the user or order is not authorized to use this coupon.
 */
export const couponNotAuthorized = (): CouponValidationResult => ({
  status: "not-authorized",
});

/**
 * Returns a validation result indicating that the coupon has already been applied to the order.
 */
export const couponAlreadyApplied = (): CouponValidationResult => ({
  status: "already-applied",
});

/**
 * Returns a validation result indicating that the order does not meet the coupon's minimum purchase requirement.
 *
 * @param minPurchase - The minimum subtotal required to apply this coupon
 */
export const couponMinPurchaseNotMet = (
  minPurchase: number,
): CouponValidationResult => ({
  status: "min-purchase-not-met",
  minPurchase,
});

/**
 * Returns a result indicating that the coupon has been successfully applied.
 */
export const couponApplied = () => ({
  status: "applied" as const,
});
