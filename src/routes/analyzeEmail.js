import { classifyEmailViaAiCore } from "../services/aiCore.js";

export async function analyzeEmailRoute(request, env) {
  try {
    const data = await request.json();
    const result = await classifyEmailViaAiCore(env, data);

    return Response.json({
      success: true,
      status: result.status,
      data: result.data ?? null,
      raw: result.raw ?? null
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        error: err.message
      },
      { status: 500 }
    );
  }
}
