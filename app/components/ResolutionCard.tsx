"use client";

import IncidentSummaryCard from "./IncidentSummaryCard";
import FeedbackForm from "./FeedbackForm";

interface ResolutionCardProps {
  incidentId: string;
  category: string;
  createdAt?: string | Date;
  username?: string;
  existingFeedback?: { rating: number; comment: string };
}

export default function ResolutionCard({
  incidentId,
  category,
  createdAt,
  username,
  existingFeedback,
}: ResolutionCardProps) {
  return (
    <div data-testid="resolution-card" className="space-y-3">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm border-l-2 border-l-green-500 text-sm text-gray-800">
        <p data-testid="resolution-message">
          Glad I was able to help you resolve the issue! Here are the ticket details for your records.
        </p>
      </div>

      <IncidentSummaryCard
        incidentId={incidentId}
        category={category}
        createdFor={username}
        createdAt={createdAt}
        status="Resolved"
      />

      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <FeedbackForm incidentId={incidentId} existingFeedback={existingFeedback} />
      </div>
    </div>
  );
}
