import { FunctionResponse } from "../common.js";

/** Request to validate a coupon against a cart total */
export interface ValidateCouponRequest {
  siteId: string;
  code: string;
  cartTotal: number;
}
/** Result of validating a coupon */
export interface ValidateCouponResult {
  discountAmount: number;
  finalTotal: number;
}
/** Response of validateCoupon containing discount details */
export type ValidateCouponResponse = FunctionResponse<ValidateCouponResult>;
