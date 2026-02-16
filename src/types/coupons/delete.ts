import { FunctionResponse } from "../common.js";

/** Request to delete a coupon */
export interface DeleteCouponRequest {
  siteId: string;
  couponId: string;
}
/** Response of deleteCoupon indicating success */
export type DeleteCouponResponse = FunctionResponse<{ success: boolean }>;
