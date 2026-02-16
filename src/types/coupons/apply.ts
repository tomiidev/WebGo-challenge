import { FunctionResponse } from "../common.js";

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
