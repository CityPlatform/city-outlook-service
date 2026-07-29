export async function classifyEmailViaAiCore(env, emailData) {
  const response = await env.CITY_AI_CORE.fetch(
    "https://internal/classify-email",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emailData)
    }
  );

  const text = await response.text();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { status: response.status, raw: text };
  }

  return { status: response.status, data: parsed };
}
