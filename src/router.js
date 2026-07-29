import { healthRoute } from "./routes/health.js";
import { testAuthRoute } from "./routes/testAuth.js";
import { syncEmailsRoute } from "./routes/syncEmails.js";
import { analyzeEmailRoute } from "./routes/analyzeEmail.js";
import { applyCategoryRoute } from "./routes/applyCategory.js";
import { processLatestRoute } from "./routes/processLatest.js";
import { debugCategoriesRoute } from "./routes/debugCategories.js";

export async function router(request, env) {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/health") {
    return healthRoute();
  }

  if (request.method === "GET" && url.pathname === "/test-auth") {
    return testAuthRoute(env);
  }

  if (
    (request.method === "GET" || request.method === "POST") &&
    url.pathname === "/sync-emails"
  ) {
    return syncEmailsRoute(env);
  }

  if (request.method === "POST" && url.pathname === "/analyze-email") {
    return analyzeEmailRoute(request, env);
  }

  if (request.method === "POST" && url.pathname === "/apply-category") {
    return applyCategoryRoute(request, env);
  }

  if (request.method === "POST" && url.pathname === "/process-latest") {
    return processLatestRoute(env);
  }

  if (request.method === "GET" && url.pathname === "/debug-categories") {
    return debugCategoriesRoute(env);
  }

  return Response.json(
    { error: "Endpoint not found" },
    { status: 404 }
  );
}
