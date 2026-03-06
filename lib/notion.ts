import { Client } from "@notionhq/client";
import type { DataSourceObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export interface NotionDatabase {
  id: string;
  title: string;
}

export async function listDatabases(): Promise<NotionDatabase[]> {
  const res = await notion.search({
    filter: { value: "data_source", property: "object" },
    sort: { direction: "descending", timestamp: "last_edited_time" },
  });
  return res.results
    .filter((r): r is DataSourceObjectResponse => r.object === "data_source")
    .map((ds) => ({
      id: ds.id,
      title: ds.title[0]?.plain_text ?? "Untitled",
    }));
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
    parent: { data_source_id: data.databaseId },
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
