import { getAccessToken } from "../services/graphAuth.js";
import { getLatestEmail, ensureCategoryRegistered, updateEmailMessage } from "../services/graphMail.js";
import { classifyEmailViaAiCore } from "../services/aiCore.js";
import { extractHeaderSignals } from "../helpers/emailHeaders.js";

// POST /process-latest
// Orchestrates: sync -> classify -> tag -> mark processed
export async function processLatestRoute(env) {
  const result = {
    success: false,
    email: null,
    classification: null,
    categoryApplied: null,
    processed: false,
    error: null
  };

  try {
    const token = await getAccessToken(env);

    const email = await getLatestEmail(token);
    if (!email) {
      result.error = "No emails found.";
      return Response.json(result);
    }

    result.email = {
      id: email.id,
      subject: email.subject,
      from: email.from.emailAddress.name,
      address: email.from.emailAddress.address,
      receivedDateTime: email.receivedDateTime
    };

    const classifyResult = await classifyEmailViaAiCore(env, {
      subject: email.subject,
      body: email.body.content,
      from: email.from.emailAddress.address,
      categories: email.categories ?? [],
      headers: extractHeaderSignals(email.internetMessageHeaders ?? [])
    });

    if (!classifyResult.data || classifyResult.data.success !== true) {
      result.error = "Classification failed.";
      result.classification = classifyResult;
      return Response.json(result);
    }

    result.classification = classifyResult.data.data;
    const category = result.classification.category;

    await ensureCategoryRegistered(token, category);

    const tagResult = await updateEmailMessage(token, email.id, {
      categories: [category],
      isRead: true
    });

    result.categoryApplied = category;
    result.processed = tagResult.status < 300;
    result.success = true;

    return Response.json(result);
  } catch (err) {
    result.error = err.message;
    return Response.json(result, { status: 500 });
  }
}
