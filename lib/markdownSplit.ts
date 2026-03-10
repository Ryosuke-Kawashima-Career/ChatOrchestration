/**
 * Returns the portion of `text` that ends on a safe markdown block boundary.
 *
 * During streaming, the accumulated text may be cut off mid-syntax (e.g. inside
 * a fenced code block or a heading line). Passing that partial text to a markdown
 * renderer produces broken output. This function finds the last "safe" split point
 * — a blank line that is outside any fenced code block — and returns everything
 * up to that point. The caller renders the returned slice and holds the rest until
 * a later chunk pushes the boundary further.
 *
 * When streaming is complete, pass `isStreaming = false` (or omit it) to get the
 * full text back unchanged.
 */
export function safeMarkdownPrefix(text: string, isStreaming = true): string {
  if (!isStreaming) return text;
  if (!text) return text;

  let inFence = false;
  let lastSafeBoundary = 0; // byte offset of the last blank-line boundary outside a fence
  let pos = 0;

  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();

    // Toggle fenced code block state on ``` or ~~~ openers/closers.
    if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
      inFence = !inFence;
    }

    pos += line.length + 1; // +1 for the \n we split on

    // A blank line outside a fence is a safe block boundary.
    // We also require it not to be the very last line so we don't
    // prematurely trim a trailing newline that's part of a complete block.
    if (!inFence && line.trim() === "" && i < lines.length - 1) {
      lastSafeBoundary = pos;
    }
  }

  // If we're outside a fence and the text already ends with a newline
  // the whole thing is safe to render (the last block is complete).
  if (!inFence && text.endsWith("\n")) {
    return text;
  }

  // Otherwise render only up to the last confirmed safe boundary.
  return text.slice(0, lastSafeBoundary);
}
