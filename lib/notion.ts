import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export interface NotionDatabase {
  id: string;
  title: string;
}

export async function listDatabases(): Promise<NotionDatabase[]> {
  const databaseId = process.env.NOTION_DATABASE_ID || "";
  if (!databaseId) return [];

  const db = await notion.databases.retrieve({ database_id: databaseId });
  const title = "title" in db
    ? db.title.map((t) => t.plain_text).join("")
    : databaseId;

  return [{ id: db.id, title }];
}

export interface SaveData {
  databaseId: string;
  prompt: string;
  provider: string;
  model: string;
  content: string;
  timestamp: string;
}

/** Splits text into ≤2000-char chunks as Notion paragraph blocks */
function contentBlocks(text: string) {
  const CHUNK = 2000;
  const sliced = text.slice(0, 20000); // cap at 20k chars (~10 blocks)
  const blocks = [];
  for (let i = 0; i < sliced.length; i += CHUNK) {
    blocks.push({
      object: "block" as const,
      type: "paragraph" as const,
      paragraph: {
        rich_text: [{ type: "text" as const, text: { content: sliced.slice(i, i + CHUNK) } }],
      },
    });
  }
  return blocks;
}

export async function savePage(data: SaveData): Promise<void> {
  await notion.pages.create({
    parent: { database_id: data.databaseId },
    properties: {
      title: {
        title: [{ text: { content: data.prompt.slice(0, 2000) } }],
      },
    },
    children: [
      {
        object: "block" as const,
        type: "heading_3" as const,
        heading_3: {
          rich_text: [
            {
              type: "text" as const,
              text: { content: `${data.provider} — ${data.model} · ${data.timestamp}` },
            },
          ],
        },
      },
      ...contentBlocks(data.content),
    ],
  });
}
