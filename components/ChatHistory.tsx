"use client";

import { useEffect, useRef } from "react";
import ResponseGrid from "./ResponseGrid";
import type { ChatMessage, LLMProvider } from "@/types";

interface Props {
  messages: ChatMessage[];
  collapsed: Record<LLMProvider, boolean>;
  onToggleCollapse: (provider: LLMProvider) => void;
}

export default function ChatHistory({ messages, collapsed, onToggleCollapse }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className="space-y-8">
      {messages.map((msg) => (
        <div key={msg.id} className="space-y-4">
          {/* User bubble */}
          <div className="flex justify-end">
            <div className="max-w-[70%] bg-gray-800 rounded-2xl rounded-tr-sm px-4 py-2.5">
              <p className="text-sm text-white">{msg.prompt}</p>
              <p className="text-xs text-gray-500 mt-1 text-right">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
          {/* Response grid */}
          <ResponseGrid responses={msg.responses} prompt={msg.prompt} timestamp={msg.timestamp} collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
