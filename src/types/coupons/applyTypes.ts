import { FunctionResponse } from "../common.js";
import { CouponDocument } from "../coupon.js";

/** Request to apply a coupon by code */
export interface ApplyCouponRequest {
  siteId: string;
  code: string;
  cartTotal: number;
}
/** Request to apply a coupon by id */
export interface ApplyCouponByIdRequest {
  siteId: string;
  couponId: string;
  orderId: string;
}

/** Result of applying a coupon */
export interface ApplyCouponResult {
  applied: boolean;
}
/** Response of applyCoupon indicating if applied */
export type ApplyCouponResponse = FunctionResponse<ApplyCouponResult>;

/**
 * Union type representing the possible outcomes of applying a coupon.
 * Can either be a validation result or a successful application.
 */
export type ApplyTransactionResult =
  | CouponValidationResult
  | { status: "applied" };

/**
 * Possible outcomes of coupon validation.
 * - `valid`: Coupon exists and is applicable.
 * - `not-found`: Coupon code or ID does not exist.
 * - `inactive`: Coupon exists but is currently inactive.
 * - `expired`: Coupon has passed its expiration date.
 * - `limit-reached`: Coupon usage limit has been reached.
 * - `not-authorized`: User or site not authorized to use the coupon.
 * - `order-not-found`: The specified order does not exist.
 * - `invalid-order`: The order is invalid for coupon application.
 * - `already-applied`: Coupon has already been applied to this order.
 * - `min-purchase-not-met`: Order total is below the required minimum for the coupon.
 * - `invalid-data`: Some request data was invalid (provides a descriptive message).
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
  | { status: "min-purchase-not-met"; minPurchase: number }
  | { status: "invalid-data"; message: string };
