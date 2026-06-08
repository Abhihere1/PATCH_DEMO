import { NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { verifyToken, getTokenFromCookieHeader } from "@/lib/auth";
import { getKbContent, getAllKbContent } from "@/lib/kb";
import { buildSystemPrompt, callLLM } from "@/lib/llm";
import { v4 as uuidv4 } from "uuid";
import type { ChatMessage, ControlDefinition, TimelineEvent } from "@/types";

interface RawIncident {
  incidentId: string;
  userId: string;
  status: string;
  category: string;
  history: ChatMessage[];
  timeline: TimelineEvent[];
  lastupdatedby: string;
  escalationDetails?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export async function POST(request: NextRequest) {
  const token = getTokenFromCookieHeader(request.headers.get("cookie"));
  const user = token ? verifyToken(token) : null;
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json() as {
    message: string;
    incidentId?: string;
    category?: string;
  };
  const { message, category } = body;
  let { incidentId } = body;

  if (!message || typeof message !== "string") {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }

  const db = await getDb();
  const collection = db.collection("Patch Transactions");

  let incident: RawIncident | null = incidentId
    ? (await collection.findOne({ incidentId, userId: user.id })) as RawIncident | null
    : null;

  if (!incident) {
    incidentId = `INC-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
    const now = new Date();
    const newIncident: RawIncident = {
      incidentId,
      userId: user.id,
      status: "Open",
      category: category || "General",
      history: [],
      timeline: [{ status: "Open", timestamp: now, actor: "Patch" }],
      lastupdatedby: "Patch",
      createdAt: now,
      updatedAt: now,
    };
    await collection.insertOne(newIncident as unknown as Record<string, unknown>);
    incident = newIncident;
  }

  if (category && incident.category !== category) {
    await collection.updateOne({ incidentId }, { $set: { category } });
    incident.category = category;
  }

  const history: ChatMessage[] = (incident.history || []) as ChatMessage[];

  if (history.length > 0) {
    const lastMsg = history[history.length - 1];
    if (lastMsg.role === "assistant" && lastMsg.controls?.status === "pending") {
      await collection.updateOne(
        { incidentId },
        {
          $set: {
            "history.$[last].controls.status": "answered",
            "history.$[last].controls.answered_value": message,
          },
        },
        { arrayFilters: [{ "last.role": "assistant", "last.controls.status": "pending" }] }
      );
      if (lastMsg.controls) {
        lastMsg.controls.status = "answered";
        lastMsg.controls.answered_value = message;
      }
    }
  }

  const userMsg: ChatMessage = {
    role: "user",
    content: message,
    timestamp: new Date(),
  };
  await collection.updateOne(
    { incidentId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { $push: { history: userMsg as any }, $set: { updatedAt: new Date() } }
  );

  const kbContent = category
    ? (getKbContent(category) || getAllKbContent())
    : getAllKbContent();

  const systemPrompt = buildSystemPrompt(kbContent);

  let llmResponse;
  try {
    llmResponse = await callLLM(systemPrompt, history, message);
  } catch (err) {
    console.error("[chat] LLM error:", err);
    return Response.json({ error: "LLM service unavailable" }, { status: 503 });
  }

  const controls: ControlDefinition | undefined = (() => {
    if (llmResponse.needs_count_first && !llmResponse.total_cards) {
      return {
        type: "form",
        status: "pending",
        needs_count_first: true,
        count_prompt: llmResponse.count_prompt,
      };
    }
    if (llmResponse.total_cards > 0) {
      return {
        type: "form",
        status: "pending",
        total_cards: llmResponse.total_cards,
        fields: llmResponse.input_card_variables,
      };
    }
    if (llmResponse.input_card_variables?.length > 0) {
      return {
        type: "form",
        status: "pending",
        fields: llmResponse.input_card_variables,
      };
    }
    if (llmResponse.user_probable_options?.length >= 5) {
      return {
        type: "select",
        status: "pending",
        options: llmResponse.user_probable_options,
      };
    }
    if (llmResponse.user_probable_options?.length >= 2) {
      return {
        type: "buttons",
        status: "pending",
        options: llmResponse.user_probable_options,
      };
    }
    return undefined;
  })();

  const assistantMsg: ChatMessage = {
    role: "assistant",
    content: llmResponse.response,
    timestamp: new Date(),
    controls,
  };

  const timelineEvent: TimelineEvent = {
    status: llmResponse.should_escalate ? "Escalated" : "Resolved",
    timestamp: new Date(),
    actor: "Patch",
  };

  const baseSet: Record<string, unknown> = {
    updatedAt: new Date(),
    lastupdatedby: "Patch",
  };
  const basePush: Record<string, unknown> = {
    history: assistantMsg as unknown as Record<string, unknown>,
  };

  if (llmResponse.should_escalate) {
    baseSet["status"] = "Escalated";
    baseSet["escalationDetails"] = llmResponse.escalation_data || {};
    baseSet["lastupdatedby"] = "Escalation Team";
    basePush["timeline"] = timelineEvent;
  } else if (llmResponse.should_resolve) {
    baseSet["status"] = "Resolved";
    basePush["timeline"] = timelineEvent;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await collection.updateOne({ incidentId }, { $push: basePush as any, $set: baseSet });

  return Response.json({
    incidentId,
    response: llmResponse.response,
    controls,
    should_escalate: llmResponse.should_escalate,
    escalation_data: llmResponse.escalation_data,
    should_resolve: llmResponse.should_resolve,
    status: llmResponse.should_escalate
      ? "Escalated"
      : llmResponse.should_resolve
      ? "Resolved"
      : "Open",
    category: incident.category,
  });
}
