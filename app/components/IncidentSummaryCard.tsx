"use client";

import Link from "next/link";
import StatusBadge from "./StatusBadge";

interface IncidentSummaryCardProps {
  incidentId: string;
  category: string;
  description?: string;
  createdFor?: string;
  createdAt?: string | Date;
  status: string;
  escalationDetails?: {
    reason?: string;
    priority?: string;
    urgency?: string;
    impact?: string;
    support_group?: string;
  };
}

export default function IncidentSummaryCard({
  incidentId,
  category,
  description,
  createdFor,
  createdAt,
  status,
  escalationDetails,
}: IncidentSummaryCardProps) {
  const isEscalated = status === "Escalated";
  const borderColor = isEscalated
    ? "border-red-200 bg-red-50"
    : status === "Resolved"
    ? "border-green-200 bg-green-50"
    : "border-gray-200 bg-white";

  const dt = createdAt ? new Date(createdAt) : new Date();
  const formatted = dt.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      data-testid="incident-summary-card"
      className={`rounded-xl border p-4 text-sm space-y-2 ${borderColor}`}
    >
      <div className="flex items-center justify-between">
        <span data-testid="summary-incident-id" className="font-mono text-xs text-gray-500">
          {incidentId}
        </span>
        <StatusBadge status={status} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div>
          <span className="text-xs text-gray-500">Category</span>
          <p data-testid="summary-category" className="font-medium text-gray-800">{category}</p>
        </div>
        {createdFor && (
          <div>
            <span className="text-xs text-gray-500">Created For</span>
            <p data-testid="summary-created-for" className="font-medium text-gray-800">{createdFor}</p>
          </div>
        )}
        <div>
          <span className="text-xs text-gray-500">Date / Time</span>
          <p data-testid="summary-date" className="font-medium text-gray-800">{formatted}</p>
        </div>
        {description && (
          <div className="col-span-2">
            <span className="text-xs text-gray-500">Description</span>
            <p data-testid="summary-description" className="font-medium text-gray-800 line-clamp-2">{description}</p>
          </div>
        )}
      </div>

      {isEscalated && escalationDetails && (
        <div className="pt-2 border-t border-red-200 grid grid-cols-2 gap-x-4 gap-y-1">
          {escalationDetails.reason && (
            <div>
              <span className="text-xs text-gray-500">Reason</span>
              <p className="font-medium text-gray-800 text-xs">{escalationDetails.reason}</p>
            </div>
          )}
          {escalationDetails.priority && (
            <div>
              <span className="text-xs text-gray-500">Priority</span>
              <p className="font-medium text-gray-800 text-xs">{escalationDetails.priority}</p>
            </div>
          )}
          {escalationDetails.urgency && (
            <div>
              <span className="text-xs text-gray-500">Urgency</span>
              <p className="font-medium text-gray-800 text-xs">{escalationDetails.urgency}</p>
            </div>
          )}
          {escalationDetails.impact && (
            <div>
              <span className="text-xs text-gray-500">Impact</span>
              <p className="font-medium text-gray-800 text-xs">{escalationDetails.impact}</p>
            </div>
          )}
          {escalationDetails.support_group && (
            <div>
              <span className="text-xs text-gray-500">Support Group</span>
              <p className="font-medium text-gray-800 text-xs">{escalationDetails.support_group}</p>
            </div>
          )}
        </div>
      )}

      <Link
        href={`/incidents/${incidentId}`}
        data-testid="summary-view-incident-link"
        className="inline-block mt-2 text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
      >
        View Incident →
      </Link>
    </div>
  );
}
