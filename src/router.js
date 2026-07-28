async function getAccessToken(env) {
  const tokenUrl = `https://login.microsoftonline.com/${env.GRAPH_TENANT_ID}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: env.GRAPH_CLIENT_ID,
    client_secret: env.GRAPH_CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials"
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  return response.json();
}

export async function router(request, env) {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/health") {
    return Response.json({
      service: "city-outlook-service",
      version: "1.0.0",
      status: "healthy",
      timestamp: new Date().toISOString()
    });
  }

  if (request.method === "GET" && url.pathname === "/test-auth") {
    const token = await getAccessToken(env);
    return Response.json(token);
  }

 if (
  (request.method === "GET" || request.method === "POST") &&
  url.pathname === "/sync-emails"
) {
  const token = await getAccessToken(env);

  const response = await fetch(
    "https://graph.microsoft.com/v1.0/users/ppatel@city-mtg.com/messages?$top=10&$select=id,subject,from,receivedDateTime,isRead",
    {
      headers: {
        Authorization: `Bearer ${token.access_token}`
      }
    }
  );

  const data = await response.json();

  return Response.json(data);
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
