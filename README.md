# Chat Orchestration

A Next.js web application that lets you compare responses from multiple LLMs side-by-side and save them to Notion.

## Overview

As a learner seeking insights from AI, it can be hard to critically evaluate a single model's answer. Chat Orchestration solves this by sending your prompt to several LLMs simultaneously and displaying their responses in a familiar chat UI — similar to ChatGPT — so you can compare them directly. Responses you find valuable can be saved to a Notion database with one click.

## Features

- Send a single prompt to Claude, GPT, and Gemini simultaneously
- Side-by-side response comparison in a ChatGPT-style UI
- Markdown rendered correctly in the chat window (headings, code blocks, tables, lists)
- Fold / expand individual LLM panels to focus on the ones you care about — collapsed state persists across responses
- Drag-to-resize panels horizontally to redistribute screen space
- Save any LLM response to a Notion database; the output is saved as structured Notion blocks (headings, paragraphs, tables) so it renders properly in Notion
- Chat history preserved within a session

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **LLM SDKs**: `@anthropic-ai/sdk`, `openai`, `@google/genai`
- **Notion Integration**: `@notionhq/client`
- **Markdown Rendering**: `react-markdown` with `remark-gfm`

## Architecture

```
Browser (Next.js pages + components)
│
│  POST /api/chat          ← streams responses from all LLMs in parallel
│  POST /api/notion/save   ← saves a selected response to Notion
│
Next.js API Routes (server-side)
│
├── OpenAI GPT
├── Google Gemini
└── Anthropic Claude
         └── Notion API
```

- All LLM and Notion API keys are server-side only.
- Each LLM call runs in parallel; responses stream to the client independently.
- Streaming is implemented via Server-Sent Events using Next.js `ReadableStream`.

## Project Structure

```
/
├── app/
│   ├── page.tsx                  # Main chat page
│   ├── layout.tsx
│   └── api/
│       ├── chat/
│       │   └── route.ts          # Dispatches prompt to all LLMs, streams results
│       └── notion/
│           ├── save/route.ts     # Saves a response entry to Notion
│           └── databases/route.ts# Lists available Notion databases
├── components/
│   ├── ChatInput.tsx             # Prompt text box + submit button
│   ├── ResponsePanel.tsx         # Single LLM response card (label + markdown) — fold/expand toggle
│   ├── ResponseGrid.tsx          # Side-by-side layout of ResponsePanels — drag-to-resize, collapse-aware
│   ├── ChatHistory.tsx           # List of past prompt/response groups
│   └── NotionSaveButton.tsx      # Save-to-Notion action + database selector
├── lib/
│   ├── llm/
│   │   ├── openai.ts             # OpenAI streaming wrapper
│   │   ├── gemini.ts             # Gemini streaming wrapper
│   │   └── anthropic.ts          # Anthropic streaming wrapper
│   ├── notion.ts                 # Notion client helpers — markdown-to-Notion block converter
│   └── markdownSplit.ts          # Buffers streamed text to safe markdown block boundaries
├── types/
│   └── index.ts                  # Shared types (Message, LLMResponse, etc.)
├── .env.local                    # API keys (never committed)
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- API keys for the LLMs you want to use (Anthropic, OpenAI, Google)
- A Notion integration token and target database ID

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_google_key
NOTION_API_KEY=your_notion_integration_token
NOTION_DATABASE_ID=your_notion_database_id
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Type a prompt in the input box at the bottom.
2. The app sends your prompt to all three LLMs simultaneously.
3. Responses stream in side-by-side for comparison.
4. Use the **▼ / ▶** chevron on any panel header to collapse or expand it. Drag the handle between panels to resize them.
5. Click **Save to Notion** on any completed response to store it in your Notion database as formatted blocks.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run package` | Build standalone output and package into a Windows `.exe` |

## Building a Windows Executable

`npm run package` produces a self-contained `dist/chat-orchestration.exe` that bundles the Node.js 22 runtime — no separate Node.js installation required on the target machine.

### What the command does

1. **`next build`** — compiles the app with `output: "standalone"` enabled in `next.config.ts`, producing a minimal server in `.next/standalone/`.
2. **`node scripts/copy-standalone-assets.mjs`** — copies `server.js`, `launcher.js`, `.next/`, `node_modules/`, and `public/` from `.next/standalone/` into `dist/`. Next.js does not do this automatically — without this step `start.bat` cannot find `server.js` at runtime.
3. **`@yao-pkg/pkg`** — bundles `launcher.js` + the Node.js 22 runtime into `dist/chat-orchestration.exe`.

> **Why the copy step matters:** `server.js` is generated inside `.next/standalone/` by the build. The `start.bat` launcher runs `node server.js` relative to its own directory (`dist/`), so `server.js` must be present there. Without the copy step you get `Error: Cannot find module 'dist\server.js'`.

### What happens when you double-click the `.exe`

1. The Next.js server starts on `http://localhost:3000`.
2. `launcher.js` polls the server every 500 ms (up to 40 retries / 20 seconds).
3. Once the server responds, it opens `http://localhost:3000` in your default browser automatically.

### Output layout

After running `npm run package`, the complete `dist/` folder looks like this:

```
dist/
├── chat-orchestration.exe   ← double-click to start the server and open the browser
├── server.js                ← standalone server (used by start.bat)
├── node_modules/            ← runtime modules loaded dynamically by Next.js
├── .next/                   ← compiled app chunks and static assets
└── start.bat                ← fallback launcher (requires system Node.js)
```

Copy the **entire `dist/` folder** to any Windows machine and double-click `chat-orchestration.exe`.

> **Note:** Due to Next.js dynamic module loading, the `.exe` may encounter runtime issues. If it does, use `start.bat` instead — it runs the identical standalone server via the system Node.js and opens the browser at `http://localhost:3000`.

### Running the executable

Double-click `dist\chat-orchestration.exe`. The app will start and open in your default browser automatically.

### Environment variables

The `.env.local` file is read from the working directory at runtime. Place it next to the executable before starting:

```
dist/
├── chat-orchestration.exe
├── server.js
├── .env.local               ← add your API keys here
├── node_modules/
└── .next/
```
