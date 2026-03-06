"use client";

import { useState } from "react";
import type { NotionDatabase } from "@/lib/notion";

interface Props {
  prompt: string;
  provider: string;
  model: string;
  content: string;
  timestamp: Date;
}

type Status = "idle" | "saving" | "saved" | "error";

export default function NotionSaveButton({ prompt, provider, model, content, timestamp }: Props) {
  const [open, setOpen] = useState(false);
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const openPanel = async () => {
    setOpen(true);
    if (databases.length > 0) return; // already fetched
    setLoading(true);
    try {
      const res = await fetch("/api/notion/databases");
      const data: NotionDatabase[] = await res.json();
      setDatabases(data);
      if (data.length > 0) setSelectedId(data[0].id);
    } catch {
      setDatabases([]);
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!selectedId) return;
    setStatus("saving");
    try {
      const res = await fetch("/api/notion/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          databaseId: selectedId,
          prompt,
          provider,
          model,
          content,
          timestamp: timestamp.toISOString(),
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("saved");
      setTimeout(() => {
        setStatus("idle");
        setOpen(false);
      }, 2000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  if (status === "saved") {
    return <span className="text-xs text-green-400">Saved to Notion ✓</span>;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {!open ? (
        <button
          onClick={openPanel}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Save to Notion
        </button>
      ) : loading ? (
        <span className="text-xs text-gray-500">Loading databases…</span>
      ) : databases.length === 0 ? (
        <span className="text-xs text-red-400">No Notion databases found</span>
      ) : (
        <>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-200 focus:outline-none"
          >
            {databases.map((db) => (
              <option key={db.id} value={db.id}>
                {db.title}
              </option>
            ))}
          </select>
          <button
            onClick={save}
            disabled={status === "saving"}
            className="text-xs px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-40 transition-colors"
          >
            {status === "saving" ? "Saving…" : "Save"}
          </button>
          {status === "error" && (
            <span className="text-xs text-red-400">Error — check Notion key</span>
          )}
          <button
            onClick={() => setOpen(false)}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            Cancel
          </button>
        </>
      )}
    </div>
  );
}
