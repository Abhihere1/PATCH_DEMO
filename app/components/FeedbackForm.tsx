"use client";

import { useState } from "react";

interface FeedbackFormProps {
  incidentId: string;
  existingFeedback?: { rating: number; comment: string };
  onSubmitted?: (rating: number, comment: string) => void;
}

export default function FeedbackForm({
  incidentId,
  existingFeedback,
  onSubmitted,
}: FeedbackFormProps) {
  const [rating, setRating] = useState(existingFeedback?.rating || 0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState(existingFeedback?.comment || "");
  const [submitted, setSubmitted] = useState(!!existingFeedback?.rating);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (submitted) {
    return (
      <div data-testid="feedback-submitted" className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">Rate Your Experience</h3>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              data-testid={`star-filled-${star}`}
              className={`text-2xl ${star <= rating ? "text-yellow-400" : "text-gray-200"}`}
            >
              ★
            </span>
          ))}
        </div>
        {comment && (
          <p data-testid="feedback-comment-readonly" className="text-sm text-gray-600 italic">&ldquo;{comment}&rdquo;</p>
        )}
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!rating) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/feedback/${incidentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      if (!res.ok) throw new Error("Failed to save feedback");
      setSubmitted(true);
      onSubmitted?.(rating, comment);
    } catch {
      setError("Failed to save feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="feedback-form" className="space-y-3">
      <div>
        <h3 data-testid="feedback-heading" className="text-sm font-semibold text-gray-800">
          Rate Your Experience
        </h3>
        <p data-testid="feedback-subtitle" className="text-xs text-gray-500 mt-0.5">
          How was your experience with Patch today?
        </p>
      </div>

      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            data-testid={`star-btn-${star}`}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className={`text-2xl transition-colors ${
              star <= (hovered || rating) ? "text-yellow-400" : "text-gray-200 hover:text-yellow-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        data-testid="feedback-comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional comments…"
        rows={3}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-200"
      />

      {error && <p data-testid="feedback-error" className="text-xs text-red-600">{error}</p>}

      <div className="flex justify-end">
        <button
          data-testid="feedback-submit-btn"
          type="button"
          onClick={handleSubmit}
          disabled={!rating || loading}
          className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Saving…" : "Submit"}
        </button>
      </div>
    </div>
  );
}
