# Chat Orchestration

A Next.js web application that lets you compare responses from multiple LLMs side-by-side and save them to Notion.

## Overview

As a learner seeking insights from AI, it can be hard to critically evaluate a single model's answer. Chat Orchestration solves this by sending your prompt to several LLMs simultaneously and displaying their responses in a familiar chat UI — similar to ChatGPT or Gemini — so you can compare them directly. Responses you find valuable can be saved to a Notion database with one click.

## Features

- Send a single prompt to multiple LLMs at once (Claude, GPT, Gemini)
- Side-by-side response comparison in a chat-style UI
- Save LLM outputs directly to a Notion database

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
│   ├── ResponsePanel.tsx         # Single LLM response card (label + markdown)
│   ├── ResponseGrid.tsx          # Side-by-side layout of ResponsePanels
│   ├── ChatHistory.tsx           # Scrollable list of past prompt/response groups
│   └── NotionSaveButton.tsx      # Save-to-Notion action + database selector
├── lib/
│   ├── llm/
│   │   ├── openai.ts             # OpenAI streaming wrapper
│   │   ├── gemini.ts             # Gemini streaming wrapper
│   │   └── anthropic.ts          # Anthropic streaming wrapper
│   └── notion.ts                 # Notion client helpers
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

1. Type a prompt in the input box.
2. The app sends your prompt to all configured LLMs simultaneously.
3. Responses appear side-by-side for comparison.
4. Click the Notion save button on any response to store it in your Notion database.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
