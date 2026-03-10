"use client";

import { useState, useRef } from "react";
import ChatHistory from "@/components/ChatHistory";
import ResponseGrid from "@/components/ResponseGrid";
import ChatInput from "@/components/ChatInput";
import type { ChatMessage, LLMProvider, LLMResponse } from "@/types";

const INITIAL_RESPONSES = (): LLMResponse[] =>
  (["openai", "google", "anthropic"] as LLMProvider[]).map((provider) => ({
    provider,
    model: "",
    content: "",
    isStreaming: true,
  }));

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeResponses, setActiveResponses] = useState<LLMResponse[]>([]);
  const [activePrompt, setActivePrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<LLMProvider, boolean>>({
    openai: false,
    google: false,
    anthropic: false,
  });
  const toggleCollapsed = (provider: LLMProvider) =>
    setCollapsed((prev) => ({ ...prev, [provider]: !prev[provider] }));
  const accRef = useRef<Record<LLMProvider, string>>({
    openai: "",
    google: "",
    anthropic: "",
  });

  const clearMessages = () => {
    if (isStreaming) return;
    setMessages([]);
  };

  const handleSubmit = async (prompt: string) => {
    accRef.current = { openai: "", google: "", anthropic: "" };
    setIsStreaming(true);
    setActivePrompt(prompt);
    setActiveResponses(INITIAL_RESPONSES());

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += value;
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          if (!frame.startsWith("data: ")) continue;
          const raw = frame.slice(6).trim();
          if (raw === "[DONE]") continue;

          let parsed: { provider?: LLMProvider; chunk?: string; done?: boolean; error?: string };
          try {
            parsed = JSON.parse(raw);
          } catch {
            continue;
          }

          const { provider, chunk, done: providerDone, error } = parsed;
          if (!provider) continue;

          if (chunk) {
            accRef.current[provider] += chunk;
            const snapshot = accRef.current[provider];
            setActiveResponses((prev) =>
              prev.map((r) => (r.provider === provider ? { ...r, content: snapshot } : r))
            );
          } else if (providerDone) {
            setActiveResponses((prev) =>
              prev.map((r) =>
                r.provider === provider
                  ? { ...r, isStreaming: false, ...(error ? { error } : {}) }
                  : r
              )
            );
          }
        }
      }
    } catch (err) {
      console.error("SSE error:", err);
    } finally {
      const finalResponses: LLMResponse[] = (
        ["openai", "google", "anthropic"] as LLMProvider[]
      ).map((p) => ({
        provider: p,
        model: "",
        content: accRef.current[p],
        isStreaming: false,
      }));

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          prompt,
          responses: finalResponses,
          timestamp: new Date(),
        },
      ]);
      setActiveResponses([]);
      setActivePrompt("");
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 text-white">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-gray-900 border-r border-gray-800">
        {/* Brand */}
        <div className="px-4 py-5 border-b border-gray-800">
          <p className="text-sm font-semibold text-white">Chat Orchestration</p>
          <p className="text-xs text-gray-500 mt-0.5">GPT-4o · Gemini · Claude</p>
        </div>

        {/* New Chat */}
        <div className="p-2 border-b border-gray-800">
          <button
            onClick={clearMessages}
            disabled={isStreaming}
            className="w-full text-left text-xs text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg px-3 py-2 transition-colors"
          >
            + New chat
          </button>
        </div>

        {/* Session history */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {messages.length === 0 ? (
            <p className="text-xs text-gray-600 px-3 py-2">No messages yet</p>
          ) : (
            <>
              <p className="text-xs text-gray-600 px-3 py-1 uppercase tracking-wider">Today</p>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="text-xs text-gray-400 truncate px-3 py-1.5 rounded-lg hover:bg-gray-800 hover:text-gray-200 cursor-default"
                  title={msg.prompt}
                >
                  {msg.prompt}
                </div>
              ))}
            </>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Scrollable area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 pt-8 pb-8 space-y-8">
            {messages.length === 0 && !isStreaming && (
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-semibold text-gray-200">What do you want to know?</h1>
                  <p className="text-gray-500 text-sm">
                    Ask once — see GPT-4o, Gemini, and Claude answer side-by-side.
                  </p>
                </div>
              </div>
            )}

            <ChatHistory messages={messages} collapsed={collapsed} onToggleCollapse={toggleCollapsed} />

            {isStreaming && (
              <div className="space-y-4">
                {/* Active user bubble */}
                <div className="flex justify-end">
                  <div className="max-w-[70%] bg-gray-800 rounded-2xl rounded-tr-sm px-4 py-2.5">
                    <p className="text-sm text-white">{activePrompt}</p>
                  </div>
                </div>
                <ResponseGrid responses={activeResponses} collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
              </div>
            )}
          </div>
        </div>

        {/* Input bar — inline, not fixed */}
        <ChatInput onSubmit={handleSubmit} disabled={isStreaming} />
      </div>
    </div>
  );
}
