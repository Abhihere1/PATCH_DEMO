"use client";

interface StatusBadgeProps {
  status: string;
}

const STATUS_STYLES: Record<string, string> = {
  Open: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  Escalated: "bg-red-50 text-red-700 border border-red-200",
  Resolved: "bg-green-50 text-green-700 border border-green-200",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status] || "bg-gray-50 text-gray-700 border border-gray-200";
  return (
    <span
      data-testid={`status-badge-${status.toLowerCase()}`}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles}`}
    >
      {status}
    </span>
  );
}
