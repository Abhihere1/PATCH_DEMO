import { NextRequest } from "next/server";
import { verifyToken, getTokenFromCookieHeader } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie");
  const token = getTokenFromCookieHeader(cookieHeader);

  if (!token) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = verifyToken(token);
  if (!user) {
    return Response.json({ error: "Invalid or expired session" }, { status: 401 });
  }

  return Response.json({ user });
}
