"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import TopNav from "../../components/TopNav";
import StatusBadge from "../../components/StatusBadge";
import MessageBubble from "../../components/MessageBubble";
import ProgressTimeline from "../../components/ProgressTimeline";
import FeedbackForm from "../../components/FeedbackForm";
import type { ChatMessage } from "@/types";

interface IncidentDetail {
  incidentId: string;
  userId: string;
  status: string;
  category: string;
  history: ChatMessage[];
  escalationDetails?: Record<string, string>;
  resolutionDetails?: Record<string, string>;
  feedback?: { rating: number; comment: string };
  timeline: Array<{ status: string; timestamp: string; actor: string }>;
  createdAt: string;
  updatedAt: string;
}

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      data-testid="copy-btn"
      onClick={handleCopy}
      className="text-xs text-gray-400 hover:text-red-600 transition-colors ml-2"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function IncidentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/incidents/${id}`)
      .then((r) => {
        if (r.status === 401) {
          router.push("/login");
          return null;
        }
        if (r.status === 404) {
          router.push("/incidents");
          return null;
        }
        return r.json();
      })
      .then((d: { incident?: IncidentDetail } | null) => {
        if (d) setIncident(d.incident || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleResumeChat = () => {
    sessionStorage.setItem("resume_incident_id", id);
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <TopNav />
        <div className="flex-1 flex items-center justify-center text-gray-400">Loading…</div>
      </div>
    );
  }

  if (!incident) return null;

  const isOpen = incident.status === "Open";
  const isEscalated = incident.status === "Escalated";
  const isResolved = incident.status === "Resolved";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopNav />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {/* Header row */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <Link
              href="/incidents"
              data-testid="back-link"
              className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
            >
              ← Back to Incidents
            </Link>
            <div className="flex items-center gap-3 mt-1">
              <h1 data-testid="incident-detail-title" className="text-xl font-bold text-gray-900">
                {incident.category} Incident
              </h1>
              <StatusBadge status={incident.status} />
            </div>
            <p className="text-xs font-mono text-gray-400 mt-1">{incident.incidentId}</p>
          </div>

          {isOpen && (
            <button
              data-testid="resume-chat-btn"
              onClick={handleResumeChat}
              className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Resume Chat
            </button>
          )}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: ~70% */}
          <div className="lg:col-span-2 space-y-6">
            {/* Conversation history */}
            <div data-testid="conversation-history-card" className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Conversation History</h2>
              </div>
              <div
                data-testid="conversation-history"
                className="px-5 py-4 overflow-y-auto"
                style={{ maxHeight: "520px" }}
              >
                {incident.history.length === 0 ? (
                  <p className="text-sm text-gray-400">No messages yet.</p>
                ) : (
                  incident.history.map((msg, idx) => (
                    <MessageBubble key={idx} message={msg} readonly />
                  ))
                )}
              </div>
            </div>

            {/* Progress timeline */}
            <div data-testid="progress-card" className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-800 mb-4">Progress</h2>
              <ProgressTimeline currentStatus={incident.status} />
            </div>

            {/* Outcome card (escalation or resolution) */}
            {(isEscalated || isResolved) && (
              <div
                data-testid="outcome-card"
                className={`bg-white border rounded-xl p-5 shadow-sm ${
                  isEscalated ? "border-red-200" : "border-green-200"
                }`}
              >
                <h2 className="font-semibold text-gray-800 mb-4">
                  {isEscalated ? "Escalation Details" : "Resolution Details"}
                </h2>

                {isEscalated && incident.escalationDetails && (
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    {[
                      ["Reason", incident.escalationDetails.reason],
                      ["Priority", incident.escalationDetails.priority],
                      ["Urgency", incident.escalationDetails.urgency],
                      ["Impact", incident.escalationDetails.impact],
                      ["Support Group", incident.escalationDetails.support_group],
                    ]
                      .filter(([, v]) => !!v)
                      .map(([label, value]) => (
                        <div key={label}>
                          <p className="text-xs text-gray-500">{label}</p>
                          <p className="font-medium text-gray-800">{value}</p>
                        </div>
                      ))}
                  </div>
                )}

                {isResolved && incident.resolutionDetails && (
                  <p className="text-sm text-gray-700 mb-4">
                    {incident.resolutionDetails.summary || "Issue resolved successfully."}
                  </p>
                )}

                <div className="border-t border-gray-100 pt-4">
                  <FeedbackForm
                    incidentId={incident.incidentId}
                    existingFeedback={incident.feedback}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right column: ~30% */}
          <div className="space-y-4">
            {/* Case details */}
            <div data-testid="case-details-card" className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-800 mb-4">Case Details</h2>
              <div className="space-y-3 text-sm">
                {[
                  ["Status", <StatusBadge key="status" status={incident.status} />],
                  ["Category", incident.category],
                  ["Created", formatDate(incident.createdAt)],
                  ["Updated", formatDate(incident.updatedAt)],
                  ...(incident.escalationDetails?.priority
                    ? [["Priority", incident.escalationDetails.priority]]
                    : []),
                  ...(incident.escalationDetails?.urgency
                    ? [["Urgency", incident.escalationDetails.urgency]]
                    : []),
                  ...(incident.escalationDetails?.impact
                    ? [["Impact", incident.escalationDetails.impact]]
                    : []),
                  ...(incident.escalationDetails?.support_group
                    ? [["Support Group", incident.escalationDetails.support_group]]
                    : []),
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex flex-col gap-0.5">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className="font-medium text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Identifiers */}
            <div data-testid="identifiers-card" className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-800 mb-4">Identifiers</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-gray-500">Incident ID</span>
                  <div className="flex items-center mt-0.5">
                    <span
                      data-testid="identifier-incident-id"
                      className="font-mono text-xs text-gray-800 break-all"
                    >
                      {incident.incidentId}
                    </span>
                    <CopyButton value={incident.incidentId} />
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">User ID</span>
                  <div className="flex items-center mt-0.5">
                    <span
                      data-testid="identifier-user-id"
                      className="font-mono text-xs text-gray-800 break-all"
                    >
                      {incident.userId}
                    </span>
                    <CopyButton value={incident.userId} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
