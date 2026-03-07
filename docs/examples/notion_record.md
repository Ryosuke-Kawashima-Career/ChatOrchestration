---
Example code of using Notion API
---

# Overview

The code shows how to make a page on Notion using API

# Implementaion

```typescript
import { Client } from "@notionhq/client";
import * as dotenv from "dotenv";

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_KEY });
const databaseId = process.env.NOTION_DATABASE_ID || "";

async function addRecord() {
  try {
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        "Name": { 
          title: [{ text: { content: "New record" } }],
        },
        "Status": {
          select: { name: "In-progress" },
        },
      },
    });
    console.log("Success:", response);
  } catch (error) {
    console.error("Error:", error);
  }
}

addRecord();
```