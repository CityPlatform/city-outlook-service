import { getAccessToken } from "../services/graphAuth.js";
import { ensureCategoryRegistered, updateEmailMessage } from "../services/graphMail.js";

// POST /apply-category  { messageId, category, markRead? }
export async function applyCategoryRoute(request, env) {
  try {
    const body = await request.json();
    const { messageId, category, markRead } = body;

    if (!messageId || !category) {
      return Response.json(
        { success: false, error: "messageId and category are required" },
        { status: 400 }
      );
    }

    const token = await getAccessToken(env);

    await ensureCategoryRegistered(token, category);

    const result = await updateEmailMessage(token, messageId, {
      categories: [category],
      isRead: markRead === true ? true : undefined
    });

    return Response.json({
      success: true,
      status: result.status,
      category,
      data: result.data
    });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
