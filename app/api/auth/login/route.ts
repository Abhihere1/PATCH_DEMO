import { NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email?: string; password?: string };
    const { email, password } = body;

    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    const db = await getDb();
    const users = db.collection("Users");
    const user = await users.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password as string);
    if (!valid) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = signToken({
      id: user._id.toString(),
      email: user.email as string,
      username: user.username as string,
    });

    const response = Response.json({
      message: "Login successful",
      user: { id: user._id.toString(), email: user.email, username: user.username },
    });

    const headers = new Headers(response.headers);
    headers.set(
      "Set-Cookie",
      `patch_token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`
    );

    return new Response(response.body, { status: 200, headers });
  } catch (err) {
    console.error("[login]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
