import { db } from "../../lib/firebase.js";
import { calculateDiscount, nowISO } from "./utils.js";
import { buildCouponDocumentFromSnapshot } from "./buildCouponDocumentFromSnapshot.js";
import { validateRawCouponData } from "./validateRawCouponData.js";
import {
  validateCouponBusinessRules,
  CouponValidationResult,
} from "./validateCouponBusinessRules.js";
import {
  couponAlreadyApplied,
  couponApplied,
  couponInvalidData,
  couponNotAuthorized,
  couponNotFound,
} from "./validateResultBuilders.js";
import { FieldValue } from "firebase-admin/firestore";

export type ApplyTransactionResult =
  | CouponValidationResult
  | { status: "applied" };
/**
 * Applies a coupon to an order within a Firestore transaction.
 *
 * This function ensures atomic consistency between the coupon and the order.
 * It guarantees that:
 *
 * 1. Both coupon and order documents exist.
 * 2. Coupon raw data is structurally valid.
 * 3. The coupon belongs to the provided site.
 * 4. The order belongs to the same site.
 * 5. The order does not already have a coupon applied.
 * 6. All coupon business rules pass (active status, usage limits,
 *    date validity, minimum purchase, etc.).
 *
 * If all validations succeed:
 * - The coupon `usedCount` is incremented.
 * - The order is updated with the applied `couponId`.
 * - Both updates happen atomically.
 *
 * The transaction prevents race conditions such as:
 * - Exceeding max usage limits
 * - Applying the same coupon multiple times concurrently
 *
 * @param couponId - The ID of the coupon to apply.
 * @param siteId - The site identifier used for ownership validation.
 * @param orderId - The order to which the coupon will be applied.
 *
 * @returns A Promise resolving to an ApplyTransactionResult:
 * - `{ status: "applied" }` if successful
 * - A structured validation result if any rule fails
 *
 * @throws Never throws. All errors are mapped to structured result objects.
 */
export const applyCouponTransaction = async (
  couponId: string,
  siteId: string,
  orderId: string,
): Promise<ApplyTransactionResult> => {
  const couponRef = db.collection("coupons").doc(couponId);
  const orderRef = db.collection("orders").doc(orderId);

  return db.runTransaction<ApplyTransactionResult>(async (tx) => {
    const [couponSnap, orderSnap] = await Promise.all([
      tx.get(couponRef),
      tx.get(orderRef),
    ]);

    if (!couponSnap.exists || !orderSnap.exists) {
      return couponNotFound();
    }

    const rawCoupon = couponSnap.data();
    const rawOrder = orderSnap.data();

    if (!rawCoupon || !rawOrder || !validateRawCouponData(rawCoupon)) {
      return couponInvalidData();
    }
    if (
      typeof rawOrder.subtotal !== "number" ||
      isNaN(rawOrder.subtotal) ||
      rawOrder.subtotal < 0
    ) {
      return couponInvalidData();
    }
    const coupon = buildCouponDocumentFromSnapshot(couponSnap);
    if (!coupon) return couponInvalidData();

    if (coupon.siteId !== siteId || rawOrder.siteId !== siteId) {
      return couponNotAuthorized();
    }

    if (rawOrder.couponId) {
      return couponAlreadyApplied();
    }

    const validation = validateCouponBusinessRules(coupon, rawOrder.subtotal);

    if (validation.status !== "valid") {
      return validation;
    }
    const discount = calculateDiscount(
      rawOrder.subtotal,
      coupon.discountType,
      coupon.discountValue,
    );
    tx.update(couponRef, {
      usedCount: FieldValue.increment(1),
      updatedAt: nowISO(),
    });

    tx.update(orderRef, {
      couponId: coupon.id,
      discountAmount: discount.discountAmount,
      finalTotal: discount.finalTotal,
      updatedAt: nowISO(),
    });

    return couponApplied();
  });
};
