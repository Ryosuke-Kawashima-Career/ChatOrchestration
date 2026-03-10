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

type NotionBlock =
  | { object: "block"; type: "heading_1"; heading_1: { rich_text: [{ type: "text"; text: { content: string } }] } }
  | { object: "block"; type: "heading_2"; heading_2: { rich_text: [{ type: "text"; text: { content: string } }] } }
  | { object: "block"; type: "heading_3"; heading_3: { rich_text: [{ type: "text"; text: { content: string } }] } }
  | { object: "block"; type: "paragraph"; paragraph: { rich_text: [{ type: "text"; text: { content: string } }] } };

function headingBlock(level: 1 | 2 | 3, text: string): NotionBlock {
  const type = `heading_${level}` as "heading_1" | "heading_2" | "heading_3";
  return { object: "block", type, [type]: { rich_text: [{ type: "text", text: { content: text.slice(0, 2000) } }] } } as NotionBlock;
}

/** Flushes accumulated paragraph lines into ≤2000-char paragraph blocks. */
function paragraphBlocks(lines: string[]): NotionBlock[] {
  const text = lines.join("\n").trim();
  if (!text) return [];
  const blocks: NotionBlock[] = [];
  for (let i = 0; i < text.length; i += 2000) {
    blocks.push({
      object: "block",
      type: "paragraph",
      paragraph: { rich_text: [{ type: "text", text: { content: text.slice(i, i + 2000) } }] },
    });
  }
  return blocks;
}

/**
 * Converts a markdown string into Notion blocks, mapping:
 *   # …   → heading_1
 *   ## …  → heading_2
 *   ### … → heading_3
 *   everything else → paragraph (chunked at 2000 chars)
 */
function contentBlocks(text: string): NotionBlock[] {
  const blocks: NotionBlock[] = [];
  const buf: string[] = []; // pending paragraph lines

  for (const line of text.slice(0, 20000).split("\n")) {
    const h3 = line.match(/^### (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h1 = line.match(/^# (.+)/);

    if (h3 || h2 || h1) {
      blocks.push(...paragraphBlocks(buf));
      buf.length = 0;
      if (h3) blocks.push(headingBlock(3, h3[1]));
      else if (h2) blocks.push(headingBlock(2, h2[1]));
      else if (h1) blocks.push(headingBlock(1, h1![1]));
    } else {
      buf.push(line);
    }
  }

  blocks.push(...paragraphBlocks(buf));
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
