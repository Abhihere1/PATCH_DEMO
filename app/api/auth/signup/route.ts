import { NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { username?: string; email?: string; password?: string };
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return Response.json({ error: "Username, email, and password are required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const db = await getDb();
    const users = db.collection("Users");

    const existing = await users.findOne({ email: email.toLowerCase() });
    if (existing) {
      return Response.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const hashed = await hashPassword(password);
    await users.insertOne({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      createdAt: new Date(),
    });

    return Response.json({ message: "Account created successfully" }, { status: 201 });
  } catch (err) {
    console.error("[signup]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
