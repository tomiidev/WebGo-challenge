# WebGo Backend Challenge - Coupon Service

## Overview

This repository contains the implementation of a coupon management backend as part of the WebGo technical challenge. It includes six core functions for creating, retrieving, updating, deleting, validating, and applying coupons.  

The service is implemented using **Firebase Functions (v2)** and **Firestore**, following strict business rules and security constraints.

---

## Features Implemented

1. **Create Coupon (`createCouponHandler`)**  
2. **Get Coupons (`getCouponsHandler`)**  
3. **Update Coupon (`updateCouponHandler`)**  
4. **Delete Coupon (`deleteCouponHandler`)**  
5. **Validate Coupon (`validateCouponHandler`)**  
6. **Apply Coupon (`applyCouponHandler`)**  

---

## Business Rules

The implementation enforces the following rules:

- **Unique code per store** – Codes like `"VERANO20"` can exist in Store A and Store B, but never twice in the same store.  
- **Code normalization** – Codes are stored and searched in a normalized format.  
- **Date handling** – Validity dates are stored as ISO strings with timezone awareness.  
- **Maximum uses** – `usedCount` cannot exceed `maxUses` if defined.  
- **Minimum purchase** – Cart total must meet `minPurchase` if defined.  
- **Active status** – Only coupons with `isActive: true` can be validated or applied.  
- **Percentage discounts ≤ 100%** – Percentage discounts are capped at 100%.  
- **Valid date range** – `validFrom` must be earlier than `validUntil`.  
- **Plan limits** – Free: 3 coupons, Service: 10 coupons, Store: unlimited.  

---

## Security

- **Authentication**: All administrative endpoints require Firebase Authentication.  
- **Authorization**: Only the store owner can modify their coupons.  
- **Public endpoints**: `validateCoupon` and `applyCoupon` do not require authentication, designed for customer checkout.  
- **Error handling**: All business and validation errors are structured using `HttpsError` for consistency.  

---

## Validation

- **Schema validation**: All inputs are validated with Zod schemas.  
- **Edge cases handled**:  
  - Invalid or missing IDs  
  - Cart total missing when required  
  - Coupon already applied  
  - Coupon expired or inactive  

---

## Project Structure

functions/
└─ coupons/
├─ auth.ts # Authentication & authorization
├─ applyCouponTrans.ts # Transactional coupon application
├─ buildCouponDocument... # Helpers to build coupon documents
├─ handlers.ts # Main exported functions
├─ schemas.ts # Zod schemas for input validation
├─ utils.ts # Utility functions (discount, date, errors)
├─ validateCouponBusinessRules.ts # Business rules & validation
└─ resultBuilders.ts # Standardized result objects
types/
└─ coupons/ # Type definitions per endpoint

## Design Decisions

- **Centralized Auth**: `requireSiteOwnership` ensures both authentication and authorization in one place.  
- **Atomic coupon application**: `applyCouponTransaction` ensures `usedCount` and order updates happen in a Firestore transaction to prevent race conditions.  
- **Structured error handling**: All errors are returned in a predictable format (`HttpsError` or structured result objects) for consistent client handling.  
- **ISO dates with timezone**: Avoids ambiguities with local time differences.  
- **Business rule separation**: Core coupon validation is in `validateCouponBusinessRules.ts` to keep handlers simple and testable.  
- **TypeScript strict types**: All functions and responses are strongly typed to prevent runtime errors.  

