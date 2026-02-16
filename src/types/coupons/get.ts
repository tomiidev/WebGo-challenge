import { FunctionResponse } from "../common.js";
import { CouponDocument } from "../coupon.js";

/** Response containing the list of coupons */
export interface GetCouponsRequest {
  siteId: string;
}

/** Response containing the list of coupons */
export type GetCouponsResponse = FunctionResponse<CouponDocument[]>;
