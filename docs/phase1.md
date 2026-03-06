# Phase 1 Workthrough — Project Scaffold

**Date completed**: 2026-03-06
**Branch**: master

---

## What was done

### Problem encountered: `create-next-app` rejected the directory name

`create-next-app@latest .` failed because the parent directory is named `ChatOrchestration`, which contains uppercase letters — a violation of npm package naming rules.

**Resolution**: Scaffolded the project manually, setting `"name": "chat-orchestration"` in `package.json`. All configuration files were authored by hand to match what `create-next-app` would have generated.

---

### Files created

| File | Purpose |
|------|---------|
| `package.json` | Project manifest; name set to `chat-orchestration` to satisfy npm rules |
| `tsconfig.json` | TypeScript config; App Router compatible, path alias `@/*` → `./` |
| `next.config.ts` | Minimal Next.js config (no custom options needed for Phase 1) |
| `tailwind.config.ts` | Tailwind content paths covering `app/`, `components/`, `pages/` |
| `postcss.config.mjs` | PostCSS with Tailwind + autoprefixer plugins |
| `eslint.config.mjs` | ESLint flat config extending `next/core-web-vitals` + `next/typescript` |
| `app/globals.css` | Global stylesheet; imports Tailwind `@base`, `@components`, `@utilities` |
| `app/layout.tsx` | Root layout with Geist font, metadata, and `globals.css` import |
| `app/page.tsx` | Placeholder home page (dark background, single status line) |
| `types/index.ts` | Shared TypeScript types: `LLMProvider`, `LLMResponse`, `ChatMessage` |
| `.env.local` | Placeholder API keys for OpenAI, Google, Anthropic, and Notion |

### Files modified

| File | Change |
|------|--------|
| `.gitignore` | Added `### Next.js ###` section: `.next/`, `node_modules/`, `.env*.local` |
| `.claude/specs/plan.md` | Phase 1 checkboxes ticked |

---

### Dependencies installed

**Production**
| Package | Version | Purpose |
|---------|---------|---------|
| `next` | ^15.1.6 | App framework |
| `react` | ^19.0.0 | UI library |
| `react-dom` | ^19.0.0 | DOM renderer |
| `openai` | ^6.27.0 | OpenAI API SDK |
| `@google/generative-ai` | ^0.24.1 | Google Gemini SDK |
| `@anthropic-ai/sdk` | ^0.78.0 | Anthropic Claude SDK |
| `@notionhq/client` | ^5.11.1 | Notion API SDK |
| `react-markdown` | ^10.1.0 | Markdown renderer |
| `remark-gfm` | ^4.0.1 | GitHub Flavored Markdown plugin |

**Development**
| Package | Purpose |
|---------|---------|
| `typescript` ^5 | Static typing |
| `tailwindcss` ^3 | Utility-first CSS |
| `autoprefixer` ^10 | Vendor-prefix CSS |
| `postcss` ^8 | CSS processing pipeline |
| `eslint` ^9 | Linting |
| `eslint-config-next` ^15 | Next.js ESLint rules |
| `@types/node`, `@types/react`, `@types/react-dom` | TypeScript definitions |

---

### Shared TypeScript types (`types/index.ts`)

```ts
export type LLMProvider = "openai" | "google" | "anthropic";

export interface LLMResponse {
  provider: LLMProvider;
  model: string;
  content: string;
  isStreaming: boolean;
  error?: string;
}

export interface ChatMessage {
  id: string;
  prompt: string;
  responses: LLMResponse[];
  timestamp: Date;
}
```

These types will be consumed by all components and API routes in subsequent phases.

---

### Verification

```
npm run build
```

**Result**: Clean build, zero TypeScript errors, zero ESLint errors.

```
Route (app)                         Size   First Load JS
┌ ○ /                              123 B        102 kB
└ ○ /_not-found                    991 B        103 kB
```

`.env.local` confirmed excluded by `.gitignore` via the `.env*.local` pattern.

---

## What comes next (Phase 2 — LLM API Layer)

### Goal
Implement server-side streaming wrappers for each LLM provider, then expose a single `/api/chat` endpoint that fans out the user's prompt to all three providers in parallel and streams responses back.

### Tasks
1. **`lib/llm/openai.ts`** — Call `openai.chat.completions.create({ stream: true })` with model `gpt-4o` (confirm GPT-5 model ID when available); yield text chunks.
2. **`lib/llm/gemini.ts`** — Call `model.generateContentStream()`; yield text chunks.
3. **`lib/llm/anthropic.ts`** — Call `anthropic.messages.stream()`; yield text chunks.
4. **`app/api/chat/route.ts`** — Accept `POST { prompt: string }`; start all three streams in parallel; return a `ReadableStream` (NDJSON or SSE) that labels each chunk with its provider.

### Open questions to resolve before starting Phase 2
| # | Question |
|---|----------|
| OQ-01 | Confirm model identifiers: GPT-5, Gemini 3 Pro, Claude Sonnet — check provider docs for the exact string at implementation time |
| OQ-02 | Should all three LLM responses always be displayed, or can users toggle providers on/off? |
| OQ-03 | Streaming protocol: plain NDJSON (`{"provider":"openai","chunk":"..."}`) or standard SSE (`data: ...`)? SSE is simpler for the client's `EventSource` API. |
