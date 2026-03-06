import { listDatabases } from "@/lib/notion";

export async function GET() {
  try {
    const databases = await listDatabases();
    return Response.json(databases);
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
