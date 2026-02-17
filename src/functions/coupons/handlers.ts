import type { CallableRequest } from "firebase-functions/v2/https";
import { db } from "../../lib/firebase.js";
import { canCreateCoupon } from "../../lib/limits.js";
import {
  calculateDiscount,
  errorResponse,
  mapCouponValidationToError,
  mapHandlerError,
  normalizeCode,
  nowISO,
  successResponse,
  validateAndFormatCouponDates,
} from "./utils.js";
import { CouponDocument } from "../../types/coupon.js";
import {
  createCouponSchema,
  deleteCouponSchema,
  getCouponsSchema,
  updateCouponSchema,
  validateApplyCouponSchema,
  validateCouponSchema,
} from "./schemas.js";
import { buildCouponDocumentFromSnapshot } from "./buildCouponDocumentFromSnapshot.js";
import { findCouponByCodeAndSite } from "./findCouponByCodeAndSite.js";
import { getCouponsBySite } from "./getCouponsBySite.js";
import { applyCouponTransaction } from "./applyCouponTrans.js";
import {
  validateCouponBusinessRules,
  validateCouponInput,
} from "./validateCouponBusinessRules.js";
import {
  CreateCouponRequest,
  CreateCouponResponse,
} from "../../types/coupons/create.js";
import {
  GetCouponsRequest,
  GetCouponsResponse,
} from "../../types/coupons/get.js";
import {
  UpdateCouponRequest,
  UpdateCouponResponse,
} from "../../types/coupons/update.js";
import {
  DeleteCouponRequest,
  DeleteCouponResponse,
} from "../../types/coupons/delete.js";
import {
  ValidateCouponRequest,
  ValidateCouponResponse,
} from "../../types/coupons/validate.js";
import {
  ApplyCouponByIdRequest,
  ApplyCouponResponse,
} from "../../types/coupons/apply.js";
import { buildCouponDocumentFromRawData } from "./buildCouponDocumentFromRawData.js";
import { requireSiteOwnership } from "./auth.js";
/**
 * Coupon Handlers
 *
 * note: It would be better to move each handler to its own file if the project grows.
 * Keeps each handler focused, easier to read, and easier to test.
 */

export const couponsCollection = db.collection("coupons");

/** Crear un nuevo cupón para una tienda. */
export const createCouponHandler = async (
  request: CallableRequest<CreateCouponRequest>,
): Promise<CreateCouponResponse> => {
  const parsedRequest = createCouponSchema.safeParse(request.data);
  if (!parsedRequest.success) {
    return errorResponse(parsedRequest.error.message);
  }

  const {
    siteId,
    code,
    discountType,
    discountValue,
    minPurchase,
    maxUses,
    validFrom,
    validUntil,
  } = parsedRequest.data;

  try {
    const { userId } = await requireSiteOwnership(request, siteId);
    const normalizedCode = normalizeCode(code);

    const canCreate = await canCreateCoupon(userId, siteId);
    if (!canCreate) return errorResponse("Plan limit reached");

    const existing = await findCouponByCodeAndSite(siteId, normalizedCode);
    if (existing) return errorResponse("Coupon code already exists");
    const inputError = validateCouponInput({
      discountType,
      discountValue,
      validFrom,
      validUntil,
    });
    if (inputError) return errorResponse(inputError);
    const validFromUTC = new Date(validFrom).toISOString();
    const validUntilUTC = new Date(validUntil).toISOString();
    if (validFromUTC >= validUntilUTC) {
      return errorResponse("validFrom must be before validUntil");
    }
    const now = nowISO();
    const docRef = couponsCollection.doc();

    const newCoupon = buildCouponDocumentFromRawData({
      id: docRef.id,
      siteId,
      userId,
      code: normalizedCode,
      discountType,
      discountValue,
      usedCount: 0,
      validFrom: validFromUTC,
      validUntil: validUntilUTC,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      ...(minPurchase ? { minPurchase } : {}),
      ...(maxUses ? { maxUses } : {}),
    });

    if (!newCoupon) {
      return errorResponse("Failed to build coupon");
    }
    await docRef.set(newCoupon);

    return successResponse(newCoupon);
  } catch (err) {
    console.error(err);
    return {
      data: null,
      error: mapHandlerError(err, "Unexpected error creating coupon"),
    };
  }
};

/** Listar todos los cupones de una tienda. */
export const getCouponsHandler = async (
  request: CallableRequest<GetCouponsRequest>,
): Promise<GetCouponsResponse> => {
  const parsed = getCouponsSchema.safeParse(request.data);

  if (!parsed.success) {
    return errorResponse(parsed.error.message);
  }

  const { siteId } = parsed.data;
  try {
    await requireSiteOwnership(request, siteId);
    const coupons = await getCouponsBySite(siteId);

    return successResponse(coupons);
  } catch (err) {
    console.error(err);
    return {
      data: null,
      error: mapHandlerError(err, "Unexpected error fetching coupons"),
    };
  }
};

/** Editar un cupón existente. */
export const updateCouponHandler = async (
  request: CallableRequest<UpdateCouponRequest>,
): Promise<UpdateCouponResponse> => {
  const { siteId, couponId, ...updates } = request.data;

  if (!couponId || Object.keys(updates).length === 0) {
    return errorResponse("couponId and updates are required");
  }

  const parsed = updateCouponSchema.safeParse({ siteId, couponId, updates });
  if (!parsed.success) {
    return errorResponse(parsed.error.message);
  }

  const validUpdates = parsed.data;

  try {
    await requireSiteOwnership(request, siteId);

    const docRef = couponsCollection.doc(couponId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return errorResponse("Coupon not found or invalid");
    }

    const existingCoupon = buildCouponDocumentFromSnapshot(docSnap);
    if (!existingCoupon) {
      return errorResponse("Invalid coupon data in database");
    }
    if (existingCoupon.siteId !== siteId) {
      return errorResponse("Coupon does not belong to this site");
    }
    const safeUpdates: Partial<CouponDocument> = {
      ...validUpdates,
      updatedAt: nowISO(),
    };
    if (validUpdates.validFrom || validUpdates.validUntil) {
      const { validFromUTC, validUntilUTC } = validateAndFormatCouponDates(
        validUpdates.validFrom,
        validUpdates.validUntil,
        existingCoupon.validFrom,
        existingCoupon.validUntil,
      );

      safeUpdates.validFrom = validFromUTC;
      safeUpdates.validUntil = validUntilUTC;
    }
    await docRef.update(safeUpdates);

    const updatedSnap = await docRef.get();
    const updatedCoupon = buildCouponDocumentFromSnapshot(updatedSnap);

    if (!updatedCoupon) {
      return errorResponse("Failed to rebuild updated coupon");
    }
    return successResponse(updatedCoupon);
  } catch (err) {
    console.error(err);
    return {
      data: null,
      error: mapHandlerError(err, "Unexpected error updating coupon"),
    };
  }
};

/** Eliminar un cupón. */
export const deleteCouponHandler = async (
  request: CallableRequest<DeleteCouponRequest>,
): Promise<DeleteCouponResponse> => {
  const parsedRequest = deleteCouponSchema.safeParse(request.data);
  if (!parsedRequest.success) {
    return errorResponse(parsedRequest.error.message);
  }

  const { siteId, couponId } = parsedRequest.data;

  try {
    await requireSiteOwnership(request, siteId);

    const docRef = couponsCollection.doc(couponId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return errorResponse("Coupon not found or invalid");
    }
    const coupon = buildCouponDocumentFromSnapshot(docSnap);
    if (!coupon) return errorResponse("Coupon not found or invalid");

    if (coupon.siteId !== siteId) {
      return errorResponse("Coupon does not belong to this site");
    }
    await docRef.delete();

    return successResponse({ success: true });
  } catch (err) {
    console.error(err);
    return {
      data: null,
      error: mapHandlerError(err, "Unexpected error deleting coupon"),
    };
  }
};

/** Validar si un cupón puede aplicarse a un carrito. */

/**
 * Public endpoint - intentionally does NOT require authentication.
 * Used during checkout by end customers.
 */
export const validateCouponHandler = async (
  request: CallableRequest<ValidateCouponRequest>,
): Promise<ValidateCouponResponse> => {
  const parsed = validateCouponSchema.safeParse(request.data);
  if (!parsed.success) {
    return errorResponse(parsed.error.message);
  }

  const { siteId, code, cartTotal } = parsed.data;

  try {
    const coupon = await findCouponByCodeAndSite(siteId, code);
    if (!coupon) return errorResponse("Coupon not found or invalid");
    const validation = validateCouponBusinessRules(coupon, cartTotal);
    if (validation.status !== "valid") {
      return errorResponse(mapCouponValidationToError(validation));
    }

    const discount = calculateDiscount(
      cartTotal,
      coupon.discountType,
      coupon.discountValue,
    );
    return successResponse(discount);
  } catch (err) {
    console.error(err);
    return {
      data: null,
      error: mapHandlerError(err, "Unexpected error validating coupon"),
    };
  }
};

/** Aplicar un cupón a una orden. */

/**
 * Public endpoint - intentionally does NOT require authentication.
 * Used during checkout by end customers.
 */
export const applyCouponHandler = async (
  request: CallableRequest<ApplyCouponByIdRequest>,
): Promise<ApplyCouponResponse> => {
  const parsed = validateApplyCouponSchema.safeParse(request.data);
  if (!parsed.success) {
    return errorResponse(parsed.error.message);
  }

  const { siteId, couponId, orderId } = parsed.data;

  try {
    const result = await applyCouponTransaction(couponId, siteId, orderId);

    if (result.status === "applied") {
      return successResponse({ applied: true });
    }

    return errorResponse(mapCouponValidationToError(result));
  } catch (err) {
    console.error(err);
    return {
      data: null,
      error: mapHandlerError(err, "Unexpected error applying coupon"),
    };
  }
};
