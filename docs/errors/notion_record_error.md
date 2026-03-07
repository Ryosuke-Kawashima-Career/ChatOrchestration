---
An error of recording LLM's output into the Notion data base
---

# Error Content

## Error Type
Runtime TypeError

## Error Message
databases.map is not a function


    at NotionSaveButton (components\NotionSaveButton.tsx:91:24)
    at ResponsePanel (components\ResponsePanel.tsx:85:11)
    at eval (components\ResponseGrid.tsx:20:9)
    at Array.map (<anonymous>:null:null)
    at ResponseGrid (components\ResponseGrid.tsx:19:18)
    at eval (components\ChatHistory.tsx:34:11)
    at Array.map (<anonymous>:null:null)
    at ChatHistory (components\ChatHistory.tsx:22:17)
    at Home (app\page.tsx:176:13)

## Code Frame
  89 |             className="text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-200 focus:outline-none"
  90 |           >
> 91 |             {databases.map((db) => (
     |                        ^
  92 |               <option key={db.id} value={db.id}>
  93 |                 {db.title}
  94 |               </option>

Next.js version: 15.5.12 (Webpack)

## Root Cause

When the `/api/notion/databases` route encounters an error, it returns an HTTP 500 response with a JSON object `{ error: "..." }` instead of an array. The client in `NotionSaveButton.tsx` was calling `res.json()` without first checking `res.ok`, so `databases` state was being set to that plain object. Since plain objects have no `.map()` method, the render crashed.

## How to Fix this error

Added a `res.ok` guard in `NotionSaveButton.tsx` (inside `openPanel`) before parsing the JSON body. If the API returns a non-2xx status, an error is thrown and the existing `catch` block resets `databases` to `[]`, safely showing "No Notion databases found" instead of crashing.

**File changed:** `components/NotionSaveButton.tsx`

```diff
  const res = await fetch("/api/notion/databases");
+ if (!res.ok) throw new Error("Failed to fetch databases");
  const data: NotionDatabase[] = await res.json();
  setDatabases(data);
```
