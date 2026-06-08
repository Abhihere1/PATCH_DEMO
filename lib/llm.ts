import type { LLMResponse, ChatMessage } from "@/types";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "https://ollama.com";
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || "";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma4:31b-cloud";

export function buildSystemPrompt(kbContent: string): string {
  return `You are Patch, an intelligent IT self-service assistant for Discount Tire store associates. Your sole purpose is to help associates troubleshoot and resolve IT issues using the provided Knowledge Base (KB) content.

## Core Rules
1. ONLY use information from the provided KB content and conversation history. Never fabricate steps or solutions.
2. If no KB content is available for the issue, say so clearly and offer to escalate.
3. Maintain conversational continuity — interpret yes/no answers relative to your previous question.
4. You MUST return ONLY valid JSON. No prose, no explanation outside the JSON object.
5. When referencing images from the KB, copy the image tag EXACTLY as it appears: ![alt](filename.png). Do NOT describe the image.

## Knowledge Base Content
${kbContent || "No KB content available for this session."}

## Response Format
You MUST return a single JSON object with EXACTLY these fields:
{
  "response": "Your Markdown-formatted response to the user. Keep it concise and actionable.",
  "user_probable_options": ["Option 1", "Option 2"],
  "input_card_variables": [{"label": "Field Label", "key": "field_key", "required": true}],
  "needs_count_first": false,
  "count_prompt": "",
  "total_cards": 0,
  "should_escalate": false,
  "escalation_data": null,
  "should_resolve": false
}

## Field Rules
- **response**: Always provide a helpful response in clean Markdown.
- **user_probable_options**: Array of 2-4 short strings for the user to select. Use [] if none needed.
- **input_card_variables**: Array of form fields for collecting structured data. Use [] if none needed.
- **needs_count_first**: Set to true ONLY when you need to ask how many devices/items before showing cards.
- **count_prompt**: The question to ask when needs_count_first is true (e.g., "How many devices need to be enrolled?").
- **total_cards**: Set to N only after the user has answered the count question. 0 otherwise.
- **should_escalate**: Set to true ONLY when the issue cannot be resolved with KB steps and requires L2 support.
- **escalation_data**: Required object when should_escalate is true: {"reason": "", "priority": "P3", "urgency": "Medium", "impact": "Individual", "support_group": "IT Support", "description": ""}
- **should_resolve**: Set to true ONLY when the user confirms the issue is fully resolved.

## Escalation Criteria
Escalate when:
- Steps in the KB have been exhausted without resolution
- The issue requires physical hardware intervention
- The user explicitly requests escalation
- Security or access issues beyond KB scope

## Resolution Criteria
Resolve when:
- The user explicitly confirms the issue is fixed
- All troubleshooting steps have been successfully completed`;
}

export function sanitizeLLMResponse(raw: string): LLMResponse {
  let cleaned = raw.trim();

  // Remove markdown code fences
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```\s*$/, "");
  cleaned = cleaned.replace(/^```\s*/i, "").replace(/\s*```\s*$/, "");

  // Extract first JSON object
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  let parsed: Partial<LLMResponse>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("[LLM] Malformed output:", raw);
    parsed = {};
  }

  const normalize = (val: unknown, fallback: unknown) => {
    if (val === undefined || val === null) return fallback;
    return val;
  };

  const normalizeBool = (val: unknown): boolean => {
    if (typeof val === "boolean") return val;
    if (typeof val === "string") return val.toLowerCase() === "true";
    return false;
  };

  return {
    response: typeof parsed.response === "string" ? parsed.response : "I encountered an issue processing your request. Please try again.",
    user_probable_options: Array.isArray(parsed.user_probable_options) ? parsed.user_probable_options : [],
    input_card_variables: Array.isArray(parsed.input_card_variables) ? parsed.input_card_variables : [],
    needs_count_first: normalizeBool(parsed.needs_count_first),
    count_prompt: typeof parsed.count_prompt === "string" ? parsed.count_prompt : "",
    total_cards: typeof parsed.total_cards === "number" ? parsed.total_cards : 0,
    should_escalate: normalizeBool(parsed.should_escalate),
    escalation_data: (parsed.escalation_data && typeof parsed.escalation_data === "object")
      ? (() => {
          const esc = parsed.escalation_data as unknown as Record<string, unknown>;
          return {
            reason: String(normalize(esc.reason, "")),
            priority: String(normalize(esc.priority, "P3")),
            urgency: String(normalize(esc.urgency, "Medium")),
            impact: String(normalize(esc.impact, "Individual")),
            support_group: String(normalize(esc.support_group, "IT Support")),
            description: String(normalize(esc.description, "")),
          };
        })()
      : null,
    should_resolve: normalizeBool(parsed.should_resolve),
  };
}

export async function callLLM(
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string
): Promise<LLMResponse> {
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(OLLAMA_API_KEY ? { Authorization: `Bearer ${OLLAMA_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[LLM] API error:", response.status, errorText);
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = await response.json() as { message?: { content?: string } };
  const rawContent = data?.message?.content || "";
  return sanitizeLLMResponse(rawContent);
}
