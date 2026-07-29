import { MAILBOX } from "../config/constants.js";
import { getAccessToken } from "../services/graphAuth.js";

// GET /list-emails?limit=50 — unread messages, for batch processing.
export async function listEmailsRoute(request, env) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 100);

    const token = await getAccessToken(env);

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages?$filter=isRead eq false&$top=${limit}&$select=id,subject,from,receivedDateTime,isRead,bodyPreview,body,categories`,
      { headers: { Authorization: `Bearer ${token.access_token}` } }
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
