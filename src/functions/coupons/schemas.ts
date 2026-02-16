import { z } from "zod";

// Define los schemas de validación para cada función.
/**
 * All coupon-related validation schemas are grouped in this file.
 *
 * If the coupon domain grows in complexity,
 * schemas can be split into separate files
 * to improve scalability and maintainability.
 */

/**
 * Zod schema for validating ISO 8601 date strings **with timezone information**.
 *
 * This schema ensures that:
 * 1. The string can be parsed into a valid Date.
 * 2. The string ends with a timezone designator, either 'Z' for UTC or an offset like '+03:00' / '-03:00'.
 *
 */
export const isoDateWithTimezone = z
  .string()
  .refine(
    (val) => !isNaN(Date.parse(val)) && /([zZ]|[+-]\d{2}:\d{2})$/.test(val),
    "Date must be a valid ISO string with timezone (e.g. -03:00 or Z)",
  );

/**
 * Schema for retrieving all coupons belonging to a specific site.
 *
 * This endpoint requires authentication and site ownership validation.
 *
 */
export const getCouponsSchema = z.object({
  siteId: z.string().min(1, "siteId is required").trim(),
});

/**
 * Base coupon validation schema.
 *
 * Represents the core coupon structure independent of persistence.
 * Used for shared validation across creation, updates and document parsing.
 */
export const couponSchema = z.object({
  code: z.string(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number(),
  minPurchase: z.number().optional(),
  maxUses: z.number().optional(),
  usedCount: z.number(),
  validFrom: z.string(),
  validUntil: z.string(),
  isActive: z.boolean(),
});

/**
 * Extended coupon schema representing a persisted document.
 *
 * Includes database-related metadata such as identifiers,
 * ownership references, and audit timestamps.
 */
export const couponDocumentSchema = couponSchema.extend({
  id: z.string(),
  siteId: z.string(),
  userId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Schema for applying a coupon to a cart.
 *
 * Ensures the request includes the site context,
 * coupon code, and a non-negative cart total.
 */
export const applyCouponSchema = z.object({
  siteId: z.string(),
  code: z.string(),
  cartTotal: z.number().nonnegative(),
});

/**
 * Schema for validating a coupon without applying it.
 *
 * Used to calculate potential discounts and verify
 * eligibility before final confirmation.
 */
export const validateCouponSchema = z.object({
  siteId: z.string(),
  code: z.string(),
  cartTotal: z.number().nonnegative(),
});

/**
 * Schema for applying a coupon to an order.
 *
 * Ensures the required identifiers are present before executing
 * the coupon application transaction.
 */
export const validateApplyCouponSchema = z.object({
  siteId: z.string(),
  couponId: z.string(),
  orderId: z.string(),
});

/**
 * Schema for updating an existing coupon.
 *
 * All fields are optional to allow partial updates.
 * Business rules must be validated separately in the domain layer.
 */
export const updateCouponSchema = z.object({
  discountType: z.enum(["percentage", "fixed"]).optional(),
  discountValue: z.number().nonnegative().optional(),
  minPurchase: z.number().nonnegative().optional(),
  maxUses: z.number().int().nonnegative().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  isActive: z.boolean().optional(),
  code: z.string().optional(),
});

/**
 * Schema for deleting a coupon.
 *
 * Requires both the site identifier and the coupon identifier
 * to ensure scoped and safe deletion.
 */
export const deleteCouponSchema = z.object({
  siteId: z.string(),
  couponId: z.string(),
});

/**
 * Schema for creating a new coupon.
 *
 * Includes domain-level validation such as:
 * - Non-empty coupon code
 * - Non-negative discount values
 * - Optional usage limits
 * - Date consistency (validFrom must be earlier than validUntil)
 */
export const createCouponSchema = z
  .object({
    siteId: z.string(),
    code: z.string().min(1, "Coupon code cannot be empty"),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.number().nonnegative("Discount value must be >= 0"),
    minPurchase: z.number().nonnegative().optional(),
    maxUses: z.number().int().nonnegative().optional(),
    validFrom: z.string(),
    validUntil: z.string(),
  })
  .refine((data) => new Date(data.validFrom) < new Date(data.validUntil), {
    message: "validFrom must be earlier than validUntil",
    path: ["validFrom", "validUntil"],
  });
