import { CouponDocument } from "../../types/coupon.js";
import { couponDocumentSchema } from "./schemas.js";

export const buildCouponDocumentFromRawData = (
  data: Partial<CouponDocument>,
): CouponDocument | null => {
  const parsed = couponDocumentSchema.safeParse(data);
  if (!parsed.success) return null;
  return parsed.data;
};
