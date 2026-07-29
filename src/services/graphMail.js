import { MAILBOX } from "../config/constants.js";
import { CATEGORY_COLORS } from "../config/categoryColors.js";

export async function getLatestEmail(token) {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages?$top=1&$select=id,subject,from,receivedDateTime,isRead,bodyPreview,body,categories`,
    {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        Prefer: 'outlook.body-content-type="text"'
      }
    }
  );

  const data = await response.json();

  if (!data.value || data.value.length === 0) {
    return null;
  }

  return data.value[0];
}

// Ensures a category name exists in the mailbox's Master Category List
// with the correct color. Required for the color to actually show in Outlook —
// just applying a category name to a message does not create a color mapping.
// If the category already exists with a different color, it is corrected.
export async function ensureCategoryRegistered(token, categoryName) {
  const color = CATEGORY_COLORS[categoryName] ?? "preset12"; // default Gray

  const listResponse = await fetch(
    `https://graph.microsoft.com/v1.0/users/${MAILBOX}/outlook/masterCategories`,
    {
      headers: { Authorization: `Bearer ${token.access_token}` }
    }
  );

  const list = await listResponse.json();
  const existing = (list.value ?? []).find(c => c.displayName === categoryName);

  if (existing) {
    if (existing.color === color) {
      return existing;
    }

    const updateResponse = await fetch(
      `https://graph.microsoft.com/v1.0/users/${MAILBOX}/outlook/masterCategories/${existing.id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ color })
      }
    );

    if (!updateResponse.ok) {
      return existing; // keep old value if the update failed, don't break the pipeline
    }

    return { ...existing, color };
  }

  const createResponse = await fetch(
    `https://graph.microsoft.com/v1.0/users/${MAILBOX}/outlook/masterCategories`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ displayName: categoryName, color })
    }
  );

  return createResponse.json();
}

// Applies a category tag to a message, and optionally marks it read.
// categories = array of strings (category display names)
export async function updateEmailMessage(token, messageId, { categories, isRead } = {}) {
  const payload = {};
  if (categories !== undefined) payload.categories = categories;
  if (isRead !== undefined) payload.isRead = isRead;

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${MAILBOX}/messages/${messageId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

  const data = await response.json();
  return { status: response.status, data };
}
