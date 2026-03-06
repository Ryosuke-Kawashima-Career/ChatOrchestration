export type LLMProvider = "openai" | "google" | "anthropic";

export interface LLMResponse {
  provider: LLMProvider;
  model: string;
  content: string;
  isStreaming: boolean;
  error?: string;
}

export interface ChatMessage {
  id: string;
  prompt: string;
  responses: LLMResponse[];
  timestamp: Date;
}
