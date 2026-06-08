import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const safeName = path.basename(filename);
  const imagePath = path.join(process.cwd(), "knowledge_base", "images", safeName);

  if (!fs.existsSync(imagePath)) {
    console.error(`[kb-image] Missing image: ${safeName}`);
    return new Response("Image not found", { status: 404 });
  }

  const buffer = fs.readFileSync(imagePath);
  const ext = path.extname(safeName).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
  };
  const contentType = mimeMap[ext] || "application/octet-stream";

  return new Response(buffer, {
    headers: { "Content-Type": contentType },
  });
}
