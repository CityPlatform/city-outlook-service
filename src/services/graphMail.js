import { MAILBOX } from "../config/constants.js";

export async function getLatestEmail(token) {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages?$top=1&$select=id,subject,from,receivedDateTime,isRead,bodyPreview,body,categories`,
    {
      headers: {
        Authorization: `Bearer ${token.access_token}`
      }
    }
  );

  const data = await response.json();

  if (!data.value || data.value.length === 0) {
    return null;
  }

  return data.value[0];
}

// Writes category tags onto a message so they show in the Outlook inbox.
// categories = array of strings, e.g. ["Lender"]
export async function updateEmailCategories(token, messageId, categories) {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages/${messageId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ categories })
    }
  );

  const data = await response.json();

  return { status: response.status, data };
}
