import { CouponDocument } from "../../types/coupon.js";
import { buildCouponDocumentFromSnapshot } from "./buildCouponDocumentFromSnapshot.js";
import { couponsCollection } from "./handlers.js";
import { normalizeCode } from "./utils.js";
/**
 * Finds a coupon by its code and associated site ID.
 *
 * This function:
 * 1. Normalizes the coupon code to ensure consistent lookups.
 * 2. Queries the `coupons` collection in Firestore filtering by `siteId` and normalized `code`.
 * 3. Builds a typed CouponDocument from the first matching document (if any).
 *
 * @param siteId - The ID of the site/store the coupon belongs to
 * @param code - The coupon code to search for
 * @returns A Promise resolving to a `CouponDocument` if found, or `null` if no matching coupon exists
 *
 */
export const findCouponByCodeAndSite = async (
  siteId: string,
  code: string,
): Promise<CouponDocument | null> => {
  const normalized = normalizeCode(code);
  const snapshot = await couponsCollection
    .where("siteId", "==", siteId)
    .where("code", "==", normalized)
    .get();
  if (snapshot.empty) return null;
  const coupon = buildCouponDocumentFromSnapshot(snapshot.docs[0]);
  return coupon;
};
