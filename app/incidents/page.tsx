"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopNav from "../components/TopNav";
import StatusBadge from "../components/StatusBadge";

interface Incident {
  incidentId: string;
  category: string;
  status: string;
  createdAt: string;
}

function timeAgo(date: string | Date): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const FILTERS = ["All", "Open", "Escalated", "Resolved"] as const;
type Filter = (typeof FILTERS)[number];

export default function IncidentsPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/incidents")
      .then((r) => {
        if (r.status === 401) {
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((d: { incidents?: Incident[] } | null) => {
        if (d) setIncidents(d.incidents || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = filter === "All" ? incidents : incidents.filter((i) => i.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopNav />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 data-testid="incidents-heading" className="text-2xl font-bold text-gray-900">
            My Incidents
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {incidents.length} total incident{incidents.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Filter tabs */}
        <div data-testid="incidents-filters" className="flex gap-1 border-b border-gray-200 mb-6">
          {FILTERS.map((f) => (
            <button
              key={f}
              data-testid={`filter-tab-${f.toLowerCase()}`}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
                filter === f
                  ? "text-red-600 border-b-2 border-red-600 bg-white -mb-px"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f}
              {f !== "All" && (
                <span className="ml-1.5 text-xs text-gray-400">
                  ({incidents.filter((i) => i.status === f).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div data-testid="incidents-loading" className="text-center py-12 text-gray-400">
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div
            data-testid="incidents-empty"
            className="text-center py-12 text-gray-400 text-sm"
          >
            No incidents yet.
          </div>
        ) : (
          <div data-testid="incidents-list" className="space-y-2">
            {filtered.map((incident) => (
              <div
                key={incident.incidentId}
                data-testid={`incident-row-${incident.incidentId}`}
                className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between shadow-sm hover:shadow transition-shadow"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span
                    data-testid={`incident-id-${incident.incidentId}`}
                    className="font-mono text-xs text-gray-400 shrink-0"
                  >
                    {incident.incidentId}
                  </span>
                  <span
                    data-testid={`incident-category-${incident.incidentId}`}
                    className="text-sm font-medium text-gray-800 capitalize truncate"
                  >
                    {incident.category}
                  </span>
                  <StatusBadge status={incident.status} />
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-4">
                  <span
                    data-testid={`incident-age-${incident.incidentId}`}
                    className="text-xs text-gray-400"
                  >
                    {timeAgo(incident.createdAt)}
                  </span>
                  <Link
                    href={`/incidents/${incident.incidentId}`}
                    data-testid={`incident-view-btn-${incident.incidentId}`}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
