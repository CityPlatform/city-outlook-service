import { getAccessToken } from "../services/graphAuth.js";

export async function testAuthRoute(env) {
  const token = await getAccessToken(env);
  return Response.json(token);
}
