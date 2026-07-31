// Prepares a raw Graph email body for classification: strips HTML down to
// plain text, cuts off quoted thread history, and truncates to a hard cap.
// This exists specifically to control AI token cost — a raw HTML body with
// a full quoted thread can run 10-50x larger than the plain new-message
// text a classifier actually needs.

const MAX_CHARS = 3000;

// Common markers where a quoted/forwarded thread begins. Order matters —
// first match wins. Covers Outlook's own reply container, plain-text
// client conventions, and forwarded-message headers.
const QUOTE_MARKERS = [
  /<div[^>]+id=["']divRplyFwdMsg["'][^>]*>/i, // Outlook web/desktop reply block
  /^-{2,}\s*Original Message\s*-{2,}/im,
  /^On .{0,80} wrote:\s*$/im,
  /^From:\s.+\nSent:\s.+\nTo:\s.+\nSubject:/im,
  /^Begin forwarded message:/im
];

function stripHtml(html) {
  if (!html) return "";

  let text = html
    // Drop non-content elements entirely (script/style bodies, comments)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    // Line breaks for block-level elements before tags are stripped
    .replace(/<\/(p|div|br|tr|li)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    // Strip all remaining tags
    .replace(/<[^>]+>/g, "")
    // Decode the handful of entities that actually show up in email bodies
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  // Collapse excess whitespace left behind by stripped markup
  text = text
    .split("\n")
    .map(line => line.trim())
    .filter((line, i, arr) => !(line === "" && arr[i - 1] === ""))
    .join("\n")
    .trim();

  return text;
}

function cutAtFirstQuoteMarker(text) {
  let earliestIndex = text.length;

  for (const marker of QUOTE_MARKERS) {
    const match = text.match(marker);
    if (match && match.index < earliestIndex) {
      earliestIndex = match.index;
    }
  }

  return text.slice(0, earliestIndex).trim();
}

/**
 * Prepares an email body for classification.
 * @param {string} rawContent - email.body.content from Microsoft Graph
 * @param {string} contentType - email.body.contentType ("html" | "text")
 * @returns {{ text: string, originalLength: number, truncated: boolean }}
 */
export function prepareEmailBodyForClassification(rawContent, contentType) {
  const originalLength = rawContent?.length ?? 0;

  let text = contentType === "html" ? stripHtml(rawContent) : (rawContent ?? "").trim();
  text = cutAtFirstQuoteMarker(text);

  const truncated = text.length > MAX_CHARS;
  if (truncated) {
    text = text.slice(0, MAX_CHARS);
  }

  return { text, originalLength, truncated };
}
