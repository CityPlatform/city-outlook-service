// Rule-based pre-filter, checked BEFORE any AI call. Anything matched here
// costs nothing and is 100% deterministic — AI is reserved for whatever
// falls through. This is the highest-leverage cost lever available: every
// email skipped here is an email that never generates a token.
//
// This is intentionally simple and conservative. A rule should only ever
// match cases you are certain about — a false skip that mis-tags something
// important is worse than the AI cost it saves. When in doubt, let it fall
// through to AI.

// Sender domains that always get the same category, no judgment required.
// Extend this list as you observe repeat senders — every entry added here
// is emails permanently removed from the AI cost line.
const KNOWN_SENDER_RULES = [
  { domainSuffix: "@docusign.net", category: "Documents" },
  { domainSuffix: "@docusign.com", category: "Documents" },
  { domainSuffix: "@calendly.com", category: "Scheduling" },
  { domainSuffix: "@noreply.github.com", category: "Notifications" }
];

/**
 * @param {object} email - { from: { emailAddress: { address } }, subject, headers }
 * @param {object} headerSignals - output of extractHeaderSignals()
 * @returns {{ skip: boolean, category: string|null, reason: string|null }}
 */
export function applyPreFilterRules(email, headerSignals) {
  const senderAddress = (email?.from?.emailAddress?.address ?? "").toLowerCase();
  const subject = (email?.subject ?? "").toLowerCase();

  // Bulk / auto-submitted mail (newsletters, automated system notices) —
  // the signal this code already extracted from headers but never used
  // locally to skip a call.
  if (headerSignals.listUnsubscribe || headerSignals.precedenceBulk) {
    return { skip: true, category: "Newsletter", reason: "bulk_mail_header" };
  }

  if (headerSignals.autoSubmitted) {
    return { skip: true, category: "Automated", reason: "auto_submitted_header" };
  }

  // Known, always-the-same-tag senders
  const senderMatch = KNOWN_SENDER_RULES.find(rule => senderAddress.endsWith(rule.domainSuffix));
  if (senderMatch) {
    return { skip: true, category: senderMatch.category, reason: "known_sender" };
  }

  // Common out-of-office subject pattern — cheap, high-confidence match
  if (/^(automatic reply|auto[- ]?reply|out of office)/i.test(subject)) {
    return { skip: true, category: "Automated", reason: "out_of_office_subject" };
  }

  return { skip: false, category: null, reason: null };
}
