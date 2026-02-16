import { CouponDocument } from "../../types/coupon.js";
import { couponDocumentSchema } from "./schemas.js";
import { nowISO } from "./utils.js";

/**
 * Builds a validated CouponDocument from a Firestore document snapshot.
 *
 * - Normalizes all date fields to UTC ISO strings.
 * - Ensures optional fields are undefined if missing.
 * - Guarantees consistent and timezone-safe output.
 */
export const buildCouponDocumentFromSnapshot = (
  docSnap: FirebaseFirestore.DocumentSnapshot,
): CouponDocument | null => {
  const raw = docSnap.data();
  if (!raw) return null;

  const toUTC = (value: any): string | undefined => {
    if (!value) return undefined;

    if (typeof value === "string") {
      return new Date(value).toISOString();
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value.toDate === "function") {
      return value.toDate().toISOString();
    }

    return undefined;
  };

  const coupon: CouponDocument = {
    id: docSnap.id,
    siteId: raw.siteId,
    userId: raw.userId,
    code: raw.code,
    discountType: raw.discountType,
    discountValue: raw.discountValue,
    minPurchase: raw.minPurchase ?? undefined,
    maxUses: raw.maxUses ?? undefined,
    usedCount: raw.usedCount,
    validFrom: toUTC(raw.validFrom)!,
    validUntil: toUTC(raw.validUntil)!,
    isActive: raw.isActive,
    createdAt: toUTC(raw.createdAt) ?? nowISO(),
    updatedAt: toUTC(raw.updatedAt) ?? nowISO(),
  };

  const parsed = couponDocumentSchema.safeParse(coupon);
  if (!parsed.success) return null;

  return parsed.data;
};
