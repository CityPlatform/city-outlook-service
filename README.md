import { MAILBOX } from "../config/constants.js";
import { getAccessToken } from "../services/graphAuth.js";

// GET /debug-message?id=<messageId> — ground-truth check of a single message's
// current isRead/categories, straight from Graph, bypassing any Outlook UI cache.
export async function debugMessageRoute(request, env) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return Response.json({ success: false, error: "id query param required" }, { status: 400 });
    }

    const token = await getAccessToken(env);

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages/${id}?$select=id,subject,isRead,categories,receivedDateTime`,
      { headers: { Authorization: `Bearer ${token.access_token}` } }
    );

    const data = await response.json();

    return Response.json({ success: response.ok, status: response.status, message: data });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
