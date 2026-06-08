import { NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { verifyToken, getTokenFromCookieHeader } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = getTokenFromCookieHeader(request.headers.get("cookie"));
  const user = token ? verifyToken(token) : null;
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const db = await getDb();
  const incidents = await db
    .collection("Patch Transactions")
    .find({ userId: user.id })
    .sort({ createdAt: -1 })
    .toArray();

  return Response.json({ incidents });
}
