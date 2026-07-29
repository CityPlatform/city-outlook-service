import { MAILBOX } from "../config/constants.js";
import { getAccessToken } from "../services/graphAuth.js";

// GET /list-emails?limit=50&days=30 — unread messages from the last N days (default 30).
export async function listEmailsRoute(request, env) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 100);
    const days = Number(url.searchParams.get("days")) || 30;

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const token = await getAccessToken(env);

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages?$filter=isRead eq false and receivedDateTime ge ${since}&$top=${limit}&$select=id,subject,from,receivedDateTime,isRead,bodyPreview,body,categories`,
      {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          Prefer: 'outlook.body-content-type="text"'
        }
      }
    );

    const data = await response.json();

    const emails = (data.value ?? []).map(email => ({
      id: email.id,
      subject: email.subject,
      from: email.from?.emailAddress?.name ?? "",
      address: email.from?.emailAddress?.address ?? "",
      receivedDateTime: email.receivedDateTime,
      isRead: email.isRead,
      body: email.body?.content ?? "",
      categories: email.categories ?? []
    }));

    return Response.json({
      success: true,
      count: emails.length,
      hasMore: Boolean(data["@odata.nextLink"]),
      emails
    });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
