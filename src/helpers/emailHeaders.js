// Pulls bulk/marketing signal headers out of Graph's internetMessageHeaders
// array, for the AI Gateway's skip filters.
export function extractHeaderSignals(internetMessageHeaders = []) {
  const find = (name) =>
    internetMessageHeaders.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

  const precedence = find("Precedence").toLowerCase();
  const autoSubmitted = find("Auto-Submitted").toLowerCase();

  return {
    listUnsubscribe: Boolean(find("List-Unsubscribe")),
    precedenceBulk: precedence.includes("bulk"),
    autoSubmitted: autoSubmitted !== "" && autoSubmitted !== "no"
  };
}
