import { MAILBOX } from "../config/constants.js";
import { getAccessToken } from "../services/graphAuth.js";

// GET /unread-count?days=30 — total unread count within the last N days (default 30).
export async function unreadCountRoute(request, env) {
  try {
    const url = new URL(request.url);
    const days = Number(url.searchParams.get("days")) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const token = await getAccessToken(env);

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages/$count?$filter=isRead eq false and receivedDateTime ge ${since}`,
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
