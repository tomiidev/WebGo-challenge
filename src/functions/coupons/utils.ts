import { FunctionResponse } from "../../types/common.js";
import { CouponValidationResult } from "./validateCouponBusinessRules.js";
/**
 * Normalizes a coupon code for consistent storage and lookup.
 * Trims whitespace and converts to lowercase.
 *
 * @param code - The coupon code to normalize
 * @returns Normalized coupon code string
 */
export const normalizeCode = (code: string) => code.trim();
/**
 * Returns the current date and time as an ISO 8601 string.
 *
 * @returns Current timestamp in ISO format
 */
export const nowISO = () => new Date().toISOString();
/**
 * Checks if the current date is within a specified range.
 *
 * @param from - Start date (inclusive) in ISO 8601 format
 * @param until - End date (inclusive) in ISO 8601 format
 * @returns True if current date is within the range, false otherwise
 */
export const isWithinDateRange = (from: string, until: string) => {
  const now = new Date();
  return now >= new Date(from) && now <= new Date(until);
};
/**
 * Calculates the discount amount and final total for a given cart.
 *
 * @param cartTotal - Total amount of the cart
 * @param type - Type of discount: "percentage" or "fixed"
 * @param value - Discount value (percentage 0-100 or fixed amount)
 * @returns Object containing:
 *   - discountAmount: the actual discount applied
 *   - finalTotal: total after discount, never less than zero
 */
export const calculateDiscount = (
  cartTotal: number,
  type: "percentage" | "fixed",
  value: number,
) => {
  let discount = type === "percentage" ? cartTotal * (value / 100) : value;

  if (discount > cartTotal) discount = cartTotal;

  return {
    discountAmount: discount,
    finalTotal: cartTotal - discount,
  };
};
/**
 * Maps a CouponValidationResult object to a user-friendly error message.
 *
 * @param validation - Result object from coupon validation
 * @returns String describing the validation error
 */
export const mapCouponValidationToError = (
  validation: CouponValidationResult,
): string =>
  validation.status === "invalid-data" ? validation.message : validation.status;
/**
 * Converts any caught error into a string message for handler responses.
 *
 * @param err - The caught error, can be Error or unknown
 * @param defaultMsg - Optional default message if error is not an instance of Error
 * @returns A string suitable for returning in { error: string }
 */
export const mapHandlerError = (
  err: unknown,
  defaultMsg = "Unexpected error",
) => {
  if (err instanceof Error) return err.message;
  return defaultMsg;
};
/**
 * Creates a successful handler response.
 */
export const successResponse = <T>(data: T): FunctionResponse<T> => ({
  data,
  error: null,
});

/**
 * Creates a standardized error handler response.
 */
export const errorResponse = <T = null>(
  message: string,
): FunctionResponse<T> => ({
  data: null,
  error: message,
});
