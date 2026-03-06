import { NextRequest } from "next/server";
import { savePage, type SaveData } from "@/lib/notion";

export async function POST(request: NextRequest) {
  try {
    const data: SaveData = await request.json();
    await savePage(data);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
