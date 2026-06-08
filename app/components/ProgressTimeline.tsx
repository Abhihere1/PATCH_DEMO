"use client";

interface ProgressTimelineProps {
  currentStatus: string;
}

const STEPS = ["Open", "Escalated", "Resolved"];

export default function ProgressTimeline({ currentStatus }: ProgressTimelineProps) {
  const currentIdx = STEPS.indexOf(currentStatus);

  return (
    <div data-testid="progress-timeline" className="flex items-center gap-0">
      {STEPS.map((step, idx) => {
        const isCompleted = idx <= currentIdx;
        const isLast = idx === STEPS.length - 1;

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                data-testid={`timeline-step-${step.toLowerCase()}`}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                  isCompleted
                    ? "bg-red-600 border-red-600 text-white"
                    : "bg-white border-gray-300 text-gray-400"
                }`}
              >
                {isCompleted ? "✓" : idx + 1}
              </div>
              <span className={`text-xs mt-1 font-medium ${isCompleted ? "text-red-600" : "text-gray-400"}`}>
                {step}
              </span>
            </div>
            {!isLast && (
              <div
                className={`h-0.5 w-16 mx-1 mb-4 transition-colors ${
                  idx < currentIdx ? "bg-red-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
