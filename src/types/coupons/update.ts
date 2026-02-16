import { FunctionResponse } from "../common.js";
import { Coupon, CouponDocument } from "../coupon.js";

/** Request to update an existing coupon */
export interface UpdateCouponRequest {
  siteId: string;
  couponId: string;
  updates: Partial<Omit<Coupon, "usedCount">>; // no se puede actualizar usedCount
}
/** Response of updateCoupon with the updated coupon */
export type UpdateCouponResponse = FunctionResponse<CouponDocument>;
