import { NextRequest } from "next/server";
import { streamOpenAI } from "@/lib/llm/openai";
import { streamGemini } from "@/lib/llm/gemini";
import { streamAnthropic } from "@/lib/llm/anthropic";
import type { LLMProvider } from "@/types";

export async function POST(request: NextRequest) {
  const { prompt } = await request.json();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      const pipe = async (
        provider: LLMProvider,
        gen: AsyncGenerator<string>
      ) => {
        try {
          for await (const chunk of gen) {
            send({ provider, chunk });
          }
          send({ provider, done: true });
        } catch (error) {
          send({ provider, error: String(error), done: true });
        }
      };

      await Promise.all([
        pipe("openai", streamOpenAI(prompt)),
        pipe("google", streamGemini(prompt)),
        pipe("anthropic", streamAnthropic(prompt)),
      ]);

      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
