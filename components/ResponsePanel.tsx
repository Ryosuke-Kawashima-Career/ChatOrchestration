"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { LLMResponse, LLMProvider } from "@/types";
import NotionSaveButton from "./NotionSaveButton";
import { safeMarkdownPrefix } from "@/lib/markdownSplit";

const CONFIG: Record<LLMProvider, { label: string; accent: string }> = {
  openai:    { label: "OpenAI",    accent: "text-emerald-400" },
  google:    { label: "Google",    accent: "text-blue-400" },
  anthropic: { label: "Anthropic", accent: "text-orange-400" },
};

interface Props {
  provider: LLMProvider;
  model: string;
  response?: LLMResponse;
  /** When provided (history only), shows Save to Notion footer */
  prompt?: string;
  timestamp?: Date;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function ResponsePanel({ provider, model, response, prompt, timestamp, collapsed = false, onToggleCollapse }: Props) {
  const { label, accent } = CONFIG[provider];
  const rawContent = response?.content ?? "";
  const streaming = response?.isStreaming ?? false;
  const error = response?.error;
  // During streaming, render only content up to the last complete markdown block
  // boundary so that partial code fences / headings never appear broken.
  const content = safeMarkdownPrefix(rawContent, streaming);

  return (
    <div className={`flex flex-col bg-gray-900 rounded-xl border border-gray-800 overflow-hidden ${collapsed ? "" : "min-h-[200px]"}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
        <span className={`font-semibold text-sm ${accent} flex-1`}>{label}</span>
        {!collapsed && <span className="text-xs text-gray-500">{model}</span>}
        {streaming && !collapsed && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            streaming
          </span>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="text-gray-500 hover:text-gray-200 transition-colors text-xs px-1"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? "▶" : "▼"}
          </button>
        )}
      </div>

      {/* Body + Footer — hidden when collapsed */}
      {!collapsed && (
        <>
          <div className="flex-1 px-4 py-3 text-sm text-gray-200 overflow-x-auto">
            {error ? (
              <p className="text-red-400 text-xs">{error}</p>
            ) : content ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-bold mt-2 mb-1">{children}</h3>,
                  p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-3">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-3">{children}</ol>,
                  code: ({ className, children }) => {
                    const isBlock = className?.includes("language-");
                    return isBlock ? (
                      <code className="block bg-gray-800 rounded-lg p-3 overflow-x-auto whitespace-pre text-xs font-mono">
                        {children}
                      </code>
                    ) : (
                      <code className="bg-gray-800 rounded px-1 text-xs font-mono">{children}</code>
                    );
                  },
                  pre: ({ children }) => <pre className="my-2 overflow-x-auto">{children}</pre>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-gray-600 pl-3 text-gray-400 italic my-2">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            ) : (
              <span className="text-gray-600 text-xs">Waiting…</span>
            )}
          </div>

          {/* Footer — save to Notion (history panels only) */}
          {prompt && timestamp && !streaming && rawContent && !error && (
            <div className="px-4 py-2 border-t border-gray-800">
              <NotionSaveButton
                prompt={prompt}
                provider={CONFIG[provider].label}
                model={model}
                content={rawContent}
                timestamp={timestamp}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
