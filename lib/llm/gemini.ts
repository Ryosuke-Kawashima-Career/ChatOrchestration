import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function* streamGemini(prompt: string): AsyncGenerator<string> {
  const result = await ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });
  for await (const chunk of result) {
    const text = chunk.text;
    if (text) yield text;
  }
}
