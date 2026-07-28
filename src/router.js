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

  // Health Check
  if (request.method === "GET" && url.pathname === "/health") {
    return Response.json({
      service: "city-outlook-service",
      version: "1.0.0",
      status: "healthy",
      timestamp: new Date().toISOString()
    });
  }

  // Test Authentication
  if (request.method === "GET" && url.pathname === "/test-auth") {
    const token = await getAccessToken(env);
    return Response.json(token);
  }

  // Sync Emails
  if (
    (request.method === "GET" || request.method === "POST") &&
    url.pathname === "/sync-emails"
  ) {
    try {
      const token = await getAccessToken(env);

      const response = await fetch(
        "https://graph.microsoft.com/v1.0/users/ppatel@city-mtg.com/messages?$top=1&$select=id,subject,from,receivedDateTime,isRead,bodyPreview,body",
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`
          }
        }
      );

      const data = await response.json();

      if (!data.value || data.value.length === 0) {
        return Response.json({
          success: false,
          message: "No emails found."
        });
      }

      const email = data.value[0];

      return Response.json({
        success: true,
     email: {
  id: email.id,
  subject: email.subject,
  from: email.from.emailAddress.name,
  address: email.from.emailAddress.address,
  receivedDateTime: email.receivedDateTime,
  isRead: email.isRead,
  bodyPreview: email.bodyPreview,
  body: email.body.content
}
      });

    } catch (err) {
      return Response.json(
        {
          success: false,
          error: err.message,
          stack: err.stack
        },
        {
          status: 500
        }
      );
    }
  }

  // Default Route
  return Response.json(
    {
      error: "Endpoint not found"
    },
    {
      status: 404
    }
  );
}
