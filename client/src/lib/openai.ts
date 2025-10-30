// src/lib/openai.ts
export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function callOpenAI(apiKey: string, messages: ChatMessage[], model = "gpt-4o-mini", max_tokens = 1200, temperature = 0.2) {
  if (!apiKey) throw new Error("Missing OpenAI API key");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens,
      temperature,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${txt}`);
  }
  const j = await res.json();
  const content = j.choices?.[0]?.message?.content ?? "";
  return content;
}
