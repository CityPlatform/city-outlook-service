import { getAccessToken } from "../services/graphAuth.js";
import { getLatestEmail } from "../services/graphMail.js";

export async function syncEmailsRoute(env) {
  try {
    const token = await getAccessToken(env);
    const email = await getLatestEmail(token);

    if (!email) {
      return Response.json({
        success: false,
        message: "No emails found."
      });
    }

    return Response.json({
      success: true,
      email: {
        id: email.id,
        subject: email.subject,
        from: email.from.emailAddress.name,
        address: email.from.emailAddress.address,
        receivedDateTime: email.receivedDateTime,
        isRead: email.isRead,
        bodyPreview: email.bodyPreview,
        body: email.body.content,
        categories: email.categories ?? []
      }
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        error: err.message,
        stack: err.stack
      },
      { status: 500 }
    );
  }
}
