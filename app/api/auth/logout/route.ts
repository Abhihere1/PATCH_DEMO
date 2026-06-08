export async function POST() {
  const headers = new Headers();
  headers.set(
    "Set-Cookie",
    "patch_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
  );
  return new Response(JSON.stringify({ message: "Logged out" }), {
    status: 200,
    headers,
  });
}
