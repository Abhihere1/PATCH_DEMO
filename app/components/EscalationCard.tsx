"use client";

import IncidentSummaryCard from "./IncidentSummaryCard";
import FeedbackForm from "./FeedbackForm";

interface EscalationCardProps {
  incidentId: string;
  category: string;
  createdAt?: string | Date;
  username?: string;
  escalationDetails?: {
    reason?: string;
    priority?: string;
    urgency?: string;
    impact?: string;
    support_group?: string;
  };
  existingFeedback?: { rating: number; comment: string };
}

export default function EscalationCard({
  incidentId,
  category,
  createdAt,
  username,
  escalationDetails,
  existingFeedback,
}: EscalationCardProps) {
  return (
    <div data-testid="escalation-card" className="space-y-3">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm border-l-2 border-l-red-600 text-sm text-gray-800">
        <p data-testid="escalation-message">
          I wasn&apos;t able to resolve the issue. I&apos;m escalating this to our Trusted Experts for hands-on support.
        </p>
      </div>

      <IncidentSummaryCard
        incidentId={incidentId}
        category={category}
        createdFor={username}
        createdAt={createdAt}
        status="Escalated"
        escalationDetails={escalationDetails}
      />

      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <FeedbackForm incidentId={incidentId} existingFeedback={existingFeedback} />
      </div>
    </div>
  );
}
