import { FieldValue } from "firebase-admin/firestore";
import type { FunctionResponse } from "./common.js";

export type DiscountType = "percentage" | "fixed";

export interface Coupon {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minPurchase?: number;
  maxUses?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export interface CouponDocument extends Coupon {
  id: string;
  siteId: string;
  userId: string;
  createdAt: string | FieldValue;
  updatedAt: string | FieldValue;
}

// Define request/response types para las 6 funciones.
