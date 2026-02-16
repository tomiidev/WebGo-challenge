import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { db } from "../../lib/firebase.js";

const sitesCollection = db.collection("sites");

/**
 * Ensures the user is authenticated.
 *
 * Administrative endpoints require Firebase Authentication.
 * Requests must include a valid Firebase ID token in the Authorization: Bearer <token> header.
 * Public endpoints (validateCoupon, applyCoupon) do not require authentication by design.
 */
export function requireAuth<T>(request: CallableRequest<T>): string {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }
  return request.auth.uid;
}

/**
 * Ensures the authenticated user owns the site.
 * Throws HttpsError with appropriate code for each failure.
 */
export async function requireSiteOwnership<T>(
  request: CallableRequest<T>,
  siteId: string,
): Promise<{ userId: string }> {
  const authUid = requireAuth(request);

  try {
    const siteDoc = await sitesCollection.doc(siteId).get();

    if (!siteDoc.exists) {
      throw new HttpsError("not-found", "Site not found");
    }

    const siteData = siteDoc.data();

    if (!siteData?.userId) {
      throw new HttpsError("not-found", "Site owner not found");
    }

    if (siteData.userId !== authUid) {
      throw new HttpsError("permission-denied", "Not authorized");
    }

    return { userId: authUid };
  } catch (err: any) {
    if (err instanceof HttpsError) throw err;

    console.error("Unexpected error in requireSiteOwnership:", err);
    throw new HttpsError("internal", "Unexpected server error");
  }
}
