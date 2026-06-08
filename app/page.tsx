"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import TopNav from "./components/TopNav";
import MessageBubble from "./components/MessageBubble";
import TypingIndicator from "./components/TypingIndicator";
import StructuredForm from "./components/StructuredForm";
import EscalationCard from "./components/EscalationCard";
import ResolutionCard from "./components/ResolutionCard";
import StatusBadge from "./components/StatusBadge";
import type { ChatMessage, ControlDefinition, FormField } from "@/types";

type UIState = "pre-chat" | "active-chat";

interface ChatApiResponse {
  incidentId: string;
  response: string;
  controls?: ControlDefinition;
  should_escalate: boolean;
  escalation_data?: Record<string, string> | null;
  should_resolve: boolean;
  status: string;
  category: string;
  error?: string;
}

interface IncidentData {
  incidentId: string;
  status: string;
  category: string;
  history: ChatMessage[];
  escalationDetails?: Record<string, string>;
  createdAt: string;
}

interface CurrentUser {
  id: string;
  email: string;
  username: string;
}

export default function MainPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [uiState, setUiState] = useState<UIState>("pre-chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [incidentStatus, setIncidentStatus] = useState("Open");
  const [incidentCategory, setIncidentCategory] = useState("General");
  const [vdiKbAvailable, setVdiKbAvailable] = useState(false);
  const [pendingControl, setPendingControl] = useState<ControlDefinition | null>(null);
  const [pendingCountPrompt, setPendingCountPrompt] = useState<{ prompt: string } | null>(null);
  const [isClosed, setIsClosed] = useState(false);
  const [closedReason, setClosedReason] = useState<"escalated" | "resolved" | null>(null);
  const [closedData, setClosedData] = useState<{
    escalationDetails?: Record<string, string>;
    createdAt?: string;
  }>({});
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { user?: CurrentUser }) => {
        if (d.user) setUser(d.user);
        else router.push("/login");
      })
      .catch(() => router.push("/login"));

    fetch("/api/kb/status")
      .then((r) => r.json())
      .then((d: { vdiAvailable?: boolean }) => setVdiKbAvailable(!!d.vdiAvailable))
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    const resumeId = sessionStorage.getItem("resume_incident_id");
    if (resumeId) {
      sessionStorage.removeItem("resume_incident_id");
      fetch(`/api/incidents/${resumeId}`)
        .then((r) => r.json())
        .then((d: { incident?: IncidentData }) => {
          if (!d.incident) return;
          const incident = d.incident;
          setIncidentId(incident.incidentId);
          setIncidentStatus(incident.status);
          setIncidentCategory(incident.category);
          setMessages(incident.history || []);
          setUiState("active-chat");

          if (incident.status !== "Open") {
            setIsClosed(true);
            setClosedReason(incident.status === "Escalated" ? "escalated" : "resolved");
            setClosedData({
              escalationDetails: incident.escalationDetails,
              createdAt: incident.createdAt,
            });
          } else {
            const hist = incident.history || [];
            const lastMsg = hist[hist.length - 1];
            if (lastMsg?.role === "assistant" && lastMsg.controls?.status === "pending") {
              setPendingControl(lastMsg.controls);
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = useCallback(
    async (text: string, category?: string) => {
      if (isTyping || !text.trim()) return;

      const userMsg: ChatMessage = {
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setPendingControl(null);
      setPendingCountPrompt(null);
      setIsTyping(true);

      if (uiState === "pre-chat") {
        setUiState("active-chat");
        if (category) setIncidentCategory(category);
      }

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            incidentId,
            category: category || incidentCategory,
          }),
        });
        const data = (await res.json()) as ChatApiResponse;

        if (!res.ok) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: data.error || "Something went wrong. Please try again.",
              timestamp: new Date(),
            },
          ]);
          setIsTyping(false);
          return;
        }

        if (!incidentId) {
          setIncidentId(data.incidentId);
        }
        setIncidentCategory(data.category || incidentCategory);
        setIncidentStatus(data.status);

        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
          controls: data.controls,
        };
        setMessages((prev) => [...prev, assistantMsg]);

        if (data.controls?.status === "pending") {
          if (data.controls.needs_count_first && data.controls.count_prompt) {
            setPendingCountPrompt({ prompt: data.controls.count_prompt });
          } else if (data.controls.type !== "buttons" && data.controls.type !== "select") {
            setPendingControl(data.controls);
          }
        }

        if (data.should_escalate) {
          setIsClosed(true);
          setClosedReason("escalated");
          setClosedData({
            escalationDetails: data.escalation_data || {},
            createdAt: new Date().toISOString(),
          });
        } else if (data.should_resolve) {
          setIsClosed(true);
          setClosedReason("resolved");
          setClosedData({ createdAt: new Date().toISOString() });
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Network error. Please check your connection and try again.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, uiState, incidentId, incidentCategory]
  );

  const handleNewChat = useCallback(() => {
    setUiState("pre-chat");
    setMessages([]);
    setInput("");
    setIncidentId(null);
    setIncidentStatus("Open");
    setIncidentCategory("General");
    setPendingControl(null);
    setPendingCountPrompt(null);
    setIsClosed(false);
    setClosedReason(null);
    setClosedData({});
    setIsTyping(false);
  }, []);

  const handleVdiTileClick = () => {
    sendMessage("I need help with a VDI issue", "vdi");
  };

  const handleFormSubmit = (values: Record<string, string>[]) => {
    const formatted = values
      .map(
        (card, i) =>
          `Device ${i + 1}: ${Object.entries(card)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ")}`
      )
      .join(" | ");
    sendMessage(formatted);
    setPendingControl(null);
  };

  const handleCountSubmit = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setPendingCountPrompt(null);
  };

  const displayName = user?.username || user?.email?.split("@")[0] || "Associate";

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <TopNav onNewChat={handleNewChat} />

      <div className="flex-1 flex flex-col overflow-hidden max-w-3xl w-full mx-auto px-4">
        {uiState === "active-chat" && incidentId && (
          <div
            data-testid="incident-header"
            className="flex items-center gap-3 py-3 border-b border-gray-200 shrink-0"
          >
            <span data-testid="incident-header-id" className="text-xs font-mono text-gray-500">
              {incidentId}
            </span>
            <span className="text-gray-300">|</span>
            <span data-testid="incident-header-category" className="text-xs font-medium text-gray-700 capitalize">
              {incidentCategory}
            </span>
            <span className="text-gray-300">|</span>
            <StatusBadge status={incidentStatus} />
          </div>
        )}

        {uiState === "pre-chat" && (
          <div
            data-testid="pre-chat-hero"
            className="flex-1 flex flex-col items-center justify-center gap-8 py-12"
            style={{
              background: "radial-gradient(ellipse at 50% 0%, rgba(220,38,38,0.04) 0%, transparent 70%)",
            }}
          >
            <div className="flex flex-col items-center gap-4 text-center max-w-xl">
              <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                P
              </div>
              <div>
                <h1 data-testid="hero-heading" className="text-2xl font-bold text-gray-900">
                  Welcome to the Discount Tire Information Center,{" "}
                  <span className="text-red-600">{displayName}</span>.
                </h1>
                <p className="text-gray-500 mt-2 text-sm">
                  How can Patch help you today?
                </p>
              </div>
            </div>

            <button
              data-testid="vdi-tile"
              onClick={handleVdiTileClick}
              className="group w-56 bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-3 shadow-sm hover:shadow-md hover:border-red-300 hover:-translate-y-1 transition-all duration-150"
            >
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-2xl group-hover:bg-red-100 transition-colors">
                🖥
              </div>
              <span data-testid="vdi-tile-label" className="font-semibold text-gray-800 text-sm">
                VDI Support
              </span>
              <span
                data-testid="vdi-kb-status"
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  vdiKbAvailable
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {vdiKbAvailable ? "KB Available" : "KB Missing"}
              </span>
            </button>
          </div>
        )}

        {uiState === "active-chat" && (
          <div
            className="flex-1 overflow-y-auto py-4"
            data-testid="chat-window"
          >
            {messages.map((msg, idx) => (
              <MessageBubble
                key={idx}
                message={msg}
                readonly={
                  idx !== messages.length - 1 ||
                  msg.role !== "assistant" ||
                  isClosed
                }
                onOptionSelect={(opt) => sendMessage(opt)}
              />
            ))}

            {isClosed && closedReason === "escalated" && incidentId && (
              <div className="mt-4">
                <EscalationCard
                  incidentId={incidentId}
                  category={incidentCategory}
                  createdAt={closedData.createdAt}
                  username={displayName}
                  escalationDetails={closedData.escalationDetails}
                />
              </div>
            )}

            {isClosed && closedReason === "resolved" && incidentId && (
              <div className="mt-4">
                <ResolutionCard
                  incidentId={incidentId}
                  category={incidentCategory}
                  createdAt={closedData.createdAt}
                  username={displayName}
                />
              </div>
            )}

            {pendingControl?.type === "form" &&
              !pendingControl.needs_count_first &&
              pendingControl.fields &&
              (pendingControl.total_cards || 1) > 0 && (
                <div className="ml-11">
                  <StructuredForm
                    fields={pendingControl.fields as FormField[]}
                    totalCards={pendingControl.total_cards || 1}
                    onSubmit={handleFormSubmit}
                    partialValues={pendingControl.partial_values}
                  />
                </div>
              )}

            {isTyping && <TypingIndicator />}
            <div ref={chatBottomRef} />
          </div>
        )}

        <div
          data-testid="composer"
          className="shrink-0 py-4 border-t border-gray-100"
        >
          {isClosed ? (
            <div
              data-testid="chat-ended-msg"
              className="text-center text-sm text-gray-400 py-3 bg-gray-50 rounded-xl border border-gray-200"
            >
              This conversation has ended.
            </div>
          ) : pendingCountPrompt ? (
            <div className="flex gap-2">
              <div className="flex-1 flex flex-col gap-1">
                <p className="text-xs text-gray-600 mb-1">{pendingCountPrompt.prompt}</p>
                <input
                  data-testid="count-input"
                  type="number"
                  min={1}
                  max={20}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCountSubmit();
                  }}
                  placeholder="Enter a number…"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />
              </div>
              <button
                data-testid="count-submit-btn"
                onClick={handleCountSubmit}
                disabled={!input}
                className="self-end px-4 py-2.5 bg-red-600 text-white font-medium text-sm rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex gap-2 bg-white border border-gray-200 rounded-2xl shadow-sm px-4 py-2.5 focus-within:border-red-400 focus-within:ring-1 focus-within:ring-red-100 transition-all"
            >
              <input
                data-testid="chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  uiState === "pre-chat"
                    ? "Describe your issue or select a category above…"
                    : "Type a message…"
                }
                disabled={isTyping}
                className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400 disabled:cursor-not-allowed"
              />
              <button
                data-testid="chat-send-btn"
                type="submit"
                disabled={isTyping || !input.trim()}
                className="shrink-0 w-8 h-8 bg-red-600 text-white rounded-xl flex items-center justify-center hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                aria-label="Send"
              >
                ↑
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
