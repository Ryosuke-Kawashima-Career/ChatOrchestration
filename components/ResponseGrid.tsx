"use client";

import { useState } from "react";
import ResponsePanel from "./ResponsePanel";
import type { LLMResponse, LLMProvider } from "@/types";

export const PROVIDERS: { provider: LLMProvider; model: string }[] = [
  { provider: "openai", model: "gpt-5-mini" },
  { provider: "google", model: "gemini-3-flash-preview" },
  { provider: "anthropic", model: "claude-sonnet-4-6" },
];

interface Props {
  responses: LLMResponse[];
  prompt?: string;
  timestamp?: Date;
}

export default function ResponseGrid({ responses, prompt, timestamp }: Props) {
  const [collapsed, setCollapsed] = useState<Record<LLMProvider, boolean>>({
    openai: false,
    google: false,
    anthropic: false,
  });

  const toggle = (provider: LLMProvider) =>
    setCollapsed((prev) => ({ ...prev, [provider]: !prev[provider] }));

  return (
    <div className="flex flex-row gap-4 items-start">
      {PROVIDERS.map(({ provider, model }) => (
        <div
          key={provider}
          className={collapsed[provider] ? "shrink-0" : "flex-1 min-w-0"}
        >
          <ResponsePanel
            provider={provider}
            model={model}
            response={responses.find((r) => r.provider === provider)}
            prompt={prompt}
            timestamp={timestamp}
            collapsed={collapsed[provider]}
            onToggleCollapse={() => toggle(provider)}
          />
        </div>
      ))}
    </div>
  );
}
