import { getAccessToken } from "../services/graphAuth.js";
import { MAILBOX } from "../config/constants.js";

// GET /debug-categories — lists the mailbox's Master Category List as-is.
// Diagnostic route, not part of the core pipeline.
export async function debugCategoriesRoute(env) {
  try {
    const token = await getAccessToken(env);

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${MAILBOX}/outlook/masterCategories`,
      { headers: { Authorization: `Bearer ${token.access_token}` } }
    );

    const data = await response.json();

    return Response.json({
      success: true,
      status: response.status,
      categories: data.value ?? data
    });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
