import { getAccessToken } from "../services/graphAuth.js";
import { getLatestEmail, ensureCategoryRegistered, updateEmailMessage } from "../services/graphMail.js";
import { classifyEmailViaAiCore } from "../services/aiCore.js";
import { extractHeaderSignals } from "../helpers/emailHeaders.js";
import { prepareEmailBodyForClassification } from "../helpers/emailBody.js";
import { applyPreFilterRules } from "../helpers/preFilter.js";

// POST /process-latest
// Orchestrates: sync -> pre-filter -> classify (if needed) -> tag -> mark processed
//
// Cost note: two changes here exist specifically to control AI spend.
// (1) applyPreFilterRules() catches bulk mail, known senders, and
//     out-of-office replies with zero AI calls — deterministic, free.
// (2) prepareEmailBodyForClassification() strips HTML and drops quoted
//     thread history before anything that DOES need AI is sent —
//     the raw Graph body can be 10-50x larger than the actual new
//     message text a classifier needs to see.
export async function processLatestRoute(env) {
  const result = {
    success: false,
    email: null,
    classification: null,
    categoryApplied: null,
    processed: false,
    skippedAi: false,
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

    const headerSignals = extractHeaderSignals(email.internetMessageHeaders ?? []);

    let category;

    const preFilterResult = applyPreFilterRules(email, headerSignals);
    if (preFilterResult.skip) {
      // Matched a deterministic rule — no AI call made at all.
      category = preFilterResult.category;
      result.classification = { category, source: "pre_filter", reason: preFilterResult.reason };
      result.skippedAi = true;
    } else {
      const { text: bodyText, originalLength, truncated } = prepareEmailBodyForClassification(
        email.body.content,
        email.body.contentType
      );

      const classifyResult = await classifyEmailViaAiCore(env, {
        subject: email.subject,
        body: bodyText,
        from: email.from.emailAddress.address,
        categories: email.categories ?? [],
        headers: headerSignals
      });

      if (!classifyResult.data || classifyResult.data.success !== true) {
        result.error = "Classification failed.";
        result.classification = classifyResult;
        return Response.json(result);
      }

      result.classification = classifyResult.data.data;
      result.classification.bodyOriginalLength = originalLength;
      result.classification.bodySentLength = bodyText.length;
      result.classification.bodyTruncated = truncated;
      category = result.classification.category;
    }

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
