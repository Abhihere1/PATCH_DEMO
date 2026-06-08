import { NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { verifyToken, getTokenFromCookieHeader } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getTokenFromCookieHeader(request.headers.get("cookie"));
  const user = token ? verifyToken(token) : null;
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const db = await getDb();
  const incident = await db
    .collection("Patch Transactions")
    .findOne({ incidentId: id, userId: user.id });

  if (!incident) {
    return Response.json({ error: "Incident not found" }, { status: 404 });
  }

  return Response.json({ incident });
}
