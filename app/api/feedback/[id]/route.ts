import { NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { verifyToken, getTokenFromCookieHeader } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getTokenFromCookieHeader(request.headers.get("cookie"));
  const user = token ? verifyToken(token) : null;
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json() as { rating?: number; comment?: string };
  const { rating, comment } = body;

  if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
    return Response.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  const db = await getDb();
  const result = await db.collection("Patch Transactions").updateOne(
    { incidentId: id, userId: user.id },
    {
      $set: {
        feedback: {
          rating,
          comment: comment || "",
          submittedAt: new Date(),
        },
        updatedAt: new Date(),
      },
    }
  );

  if (result.matchedCount === 0) {
    return Response.json({ error: "Incident not found" }, { status: 404 });
  }

  return Response.json({ message: "Feedback saved" });
}
