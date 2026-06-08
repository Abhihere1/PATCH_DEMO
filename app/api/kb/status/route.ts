import { vdiKbAvailable, scannerKbAvailable } from "@/lib/kb";

export async function GET() {
  return Response.json({
    vdiAvailable: vdiKbAvailable(),
    scannerAvailable: scannerKbAvailable(),
  });
}
