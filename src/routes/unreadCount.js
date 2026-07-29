import { MAILBOX } from "../config/constants.js";
import { getAccessToken } from "../services/graphAuth.js";

// GET /unread-count — true total unread count (not capped like /list-emails).
export async function unreadCountRoute(env) {
  try {
    const token = await getAccessToken(env);

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages/$count?$filter=isRead eq false`,
      {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          ConsistencyLevel: "eventual"
        }
      }
    );

    const text = await response.text();

    return Response.json({
      success: response.ok,
      status: response.status,
      unreadCount: response.ok ? Number(text) : null,
      raw: response.ok ? undefined : text
    });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
