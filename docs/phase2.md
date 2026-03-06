# Phase 2 — LLM API Layer: Workthrough

**Date**: 2026-03-06

---

## SDK Swap — `@google/generative-ai` → `@google/genai`

`@google/generative-ai` reached end-of-life in August 2025. The replacement is `@google/genai`, which ships an identical surface for content generation with a cleaner `GoogleGenAI` class and a `models.generateContentStream()` method returning an `AsyncGenerator<GenerateContentResponse>`.

No environment variable rename was needed; `GOOGLE_GENERATIVE_AI_API_KEY` is used by both SDKs.

---

## Streaming Design

Each wrapper (`lib/llm/*.ts`) is an **async generator** — it yields raw text chunks as they arrive from the provider's streaming API. This keeps provider-specific logic isolated and lets the API route compose them without buffering.

```
Provider SDK streaming API
  └── async generator (yields string chunks)
        └── pipe() helper in route.ts (wraps in SSE frames)
              └── ReadableStream → browser
```

---

## SSE Protocol

The `/api/chat` route returns a single `text/event-stream` response. All three provider streams are fanned out concurrently via `Promise.all`. Chunks are interleaved as they arrive.

### Message formats

| Event | Shape |
|-------|-------|
| Text chunk | `data: {"provider":"openai","chunk":"Hello"}\n\n` |
| Provider done | `data: {"provider":"openai","done":true}\n\n` |
| Provider error | `data: {"provider":"openai","error":"...","done":true}\n\n` |
| Stream end | `data: [DONE]\n\n` |

Each provider error is caught independently — one failing provider does not abort the others.

---

## Model IDs

| Provider | Model | Source |
|----------|-------|--------|
| OpenAI | `gpt-4o` (default; override via `OPENAI_MODEL` env var) | `lib/llm/openai.ts` |
| Google | `gemini-3.1-pro-preview` (upgraded from `gemini-2.0-flash`; `gemini-3-pro-preview` deprecated, shuts down 2026-03-09) | `lib/llm/gemini.ts` |
| Anthropic | `claude-sonnet-4-6` | `lib/llm/anthropic.ts` |

---

## Build Verification

```
✓ Compiled successfully
Route (app)          Size
├ ○ /               127 B
└ ƒ /api/chat       127 B   ← dynamic (SSE)
```

Zero TypeScript errors. The `/api/chat` route is correctly classified as dynamic (server-rendered on demand).

---

## Phase 3 Preview — Core UI

Next phase builds the React layer:

- `ChatInput` — prompt textarea + submit, disabled while streaming
- `ResponsePanel` — per-provider card with streaming text and `react-markdown` rendering
- `ResponseGrid` — side-by-side CSS grid of the three panels
- `ChatHistory` — scrollable history above the grid
- `page.tsx` — wires state and SSE consumption to the UI
