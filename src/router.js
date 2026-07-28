export async function router(request, env) {
  const url = new URL(request.url);

  // Health Check
  if (request.method === "GET" && url.pathname === "/health") {
    return Response.json({
      service: "city-outlook-service",
      version: "1.0.0",
      status: "healthy",
      timestamp: new Date().toISOString()
    });
  }

  // Outlook Sync
  if (request.method === "POST" && url.pathname === "/sync-emails") {
    return Response.json({
      success: true,
      message: "Outlook Service is ready."
    });
  }

  return Response.json(
    {
      error: "Endpoint not found"
    },
    {
      status: 404
    }
  );
}
