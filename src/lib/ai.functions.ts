import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.5-flash";

async function callGateway(system: string, user: string): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this project.");

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("AI is rate limited right now. Try again shortly.");
    if (res.status === 402) throw new Error("AI credits are exhausted for this workspace.");
    throw new Error(`AI request failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? "";
}

function parseJson<T>(raw: string): T | null {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

export const parseNaturalTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { text: string; today: string }) =>
    z.object({ text: z.string().min(1).max(500), today: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    const raw = await callGateway(
      `You turn natural language into a task. Today is ${data.today}.
Respond with ONLY JSON: {"title": string, "priority": "Low"|"Medium"|"High"|"Urgent", "due_date": string|null, "tags": string[], "description": string}
due_date must be YYYY-MM-DD or null. Keep the title short and imperative. Infer priority from words like urgent/asap/important. Tags are short lowercase keywords (max 3).`,
      data.text,
    );

    const parsed = parseJson<{
      title?: string;
      priority?: string;
      due_date?: string | null;
      tags?: string[];
      description?: string;
    }>(raw);

    const priorities = ["Low", "Medium", "High", "Urgent"];
    return {
      title: parsed?.title?.trim() || data.text.slice(0, 120),
      priority: priorities.includes(parsed?.priority ?? "") ? parsed!.priority! : "Medium",
      due_date: /^\d{4}-\d{2}-\d{2}$/.test(parsed?.due_date ?? "") ? parsed!.due_date! : null,
      tags: (parsed?.tags ?? []).filter((t) => typeof t === "string").slice(0, 3),
      description: parsed?.description ?? "",
    };
  });

export const breakdownTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { title: string; description: string }) =>
    z
      .object({ title: z.string().min(1).max(300), description: z.string().max(4000) })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const raw = await callGateway(
      `You break a task into 3-5 concrete, actionable subtasks.
Respond with ONLY JSON: {"subtasks": string[]} — each string is short (max 80 chars).`,
      `Task: ${data.title}\nDetails: ${data.description || "(none)"}`,
    );

    const parsed = parseJson<{ subtasks?: string[] }>(raw);
    const subtasks = (parsed?.subtasks ?? [])
      .filter((s) => typeof s === "string" && s.trim())
      .slice(0, 5)
      .map((s) => s.trim());

    if (!subtasks.length) throw new Error("The AI did not return any subtasks. Try again.");
    return { subtasks };
  });
