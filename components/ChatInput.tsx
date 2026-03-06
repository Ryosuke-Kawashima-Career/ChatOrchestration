"use client";

import { useState, KeyboardEvent } from "react";

interface Props {
  onSubmit: (prompt: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSubmit, disabled = false }: Props) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="bg-gray-950 border-t border-gray-800 px-4 py-4 shrink-0">
      <div className="max-w-6xl mx-auto flex gap-3 items-end">
        <textarea
          className="flex-1 bg-gray-900 text-white text-sm rounded-xl border border-gray-700 px-4 py-3 resize-none focus:outline-none focus:border-gray-500 placeholder-gray-600"
          rows={2}
          placeholder="Ask all three models…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <button
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="px-5 py-3 rounded-xl bg-white text-gray-950 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
