import ResponsePanel from "./ResponsePanel";
import type { LLMResponse, LLMProvider } from "@/types";

export const PROVIDERS: { provider: LLMProvider; model: string }[] = [
  { provider: "openai",    model: "gpt-5" },
  { provider: "google",    model: "gemini-2.5-pro-preview" },
  { provider: "anthropic", model: "claude-sonnet-4-6" },
];

interface Props {
  responses: LLMResponse[];
  prompt?: string;
  timestamp?: Date;
}

export default function ResponseGrid({ responses, prompt, timestamp }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {PROVIDERS.map(({ provider, model }) => (
        <ResponsePanel
          key={provider}
          provider={provider}
          model={model}
          response={responses.find((r) => r.provider === provider)}
          prompt={prompt}
          timestamp={timestamp}
        />
      ))}
    </div>
  );
}
