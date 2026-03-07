import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function* streamOpenAI(prompt: string): AsyncGenerator<string> {
  const stream = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
    messages: [{ role: "user", content: prompt }],
    stream: true,
  });
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? "";
    if (text) yield text;
  }
}
