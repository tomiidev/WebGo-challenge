import { FunctionResponse } from "../common.js";
import { CouponDocument, DiscountType } from "../coupon.js";

/** Request to create a new coupon for a store */
export interface CreateCouponRequest {
  siteId: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minPurchase?: number;
  maxUses?: number;
  validFrom: string;
  validUntil: string;
}
/** Response of createCoupon with the created coupon */
export type CreateCouponResponse = FunctionResponse<CouponDocument>;
