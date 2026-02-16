// helpers/coupons.ts
import { buildCouponDocumentFromSnapshot } from "./buildCouponDocumentFromSnapshot.js";
import type { CouponDocument } from "../../types/coupon.js";
import { couponsCollection } from "./handlers.js";

/**
 * Retrieves all coupons for a specific site, ordered by creation date (newest first).
 *
 * This function:
 * 1. Queries the `coupons` collection in Firestore filtering by `siteId`.
 * 2. Orders results by `createdAt` in descending order.
 * 3. Builds typed `CouponDocument` objects from Firestore snapshots.
 * 4. Filters out any invalid or malformed coupon documents.
 *
 * @param siteId - The ID of the site/store to fetch coupons for
 * @returns A Promise resolving to an array of valid `CouponDocument` objects (empty array if none found)
 *
 */
export const getCouponsBySite = async (
  siteId: string,
): Promise<CouponDocument[]> => {
  const snapshot = await couponsCollection
    .where("siteId", "==", siteId)
    .orderBy("createdAt", "desc")
    .get();

  if (snapshot.empty) return [];

  return snapshot.docs
    .map((doc) => buildCouponDocumentFromSnapshot(doc))
    .filter((c): c is CouponDocument => !!c);
};
