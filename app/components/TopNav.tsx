"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface TopNavProps {
  onNewChat?: () => void;
}

export default function TopNav({ onNewChat }: TopNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [incidentCount, setIncidentCount] = useState(0);

  useEffect(() => {
    fetch("/api/incidents")
      .then((r) => r.json())
      .then((d: { incidents?: unknown[] }) => setIncidentCount(d.incidents?.length || 0))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const isOnMain = pathname === "/";

  return (
    <nav
      data-testid="top-nav"
      className="bg-white border-b border-gray-200 h-14 flex items-center px-6 shrink-0 sticky top-0 z-50"
    >
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
        <Link
          href="/"
          data-testid="nav-logo-link"
          className="flex items-center gap-2 group"
        >
          <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
            P
          </div>
          <span className="font-bold text-gray-900 text-sm tracking-tight">Patch</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/incidents"
            data-testid="nav-incidents-link"
            className={`relative px-3 py-1.5 text-sm font-medium transition-colors rounded-md hover:bg-gray-50 ${
              pathname?.startsWith("/incidents")
                ? "text-red-600 border-b-2 border-red-600 rounded-none"
                : "text-gray-600"
            }`}
          >
            Incidents
            {incidentCount > 0 && (
              <span
                data-testid="nav-incidents-badge"
                className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-red-600 text-white text-xs rounded-full"
              >
                {incidentCount > 99 ? "99+" : incidentCount}
              </span>
            )}
          </Link>

          <button
            data-testid="nav-new-chat-btn"
            onClick={onNewChat || (() => {
              if (!isOnMain) router.push("/");
            })}
            className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-md hover:bg-gray-50 ${
              isOnMain && !pathname?.startsWith("/incidents")
                ? "text-red-600"
                : "text-gray-600"
            }`}
          >
            New Chat
          </button>

          <button
            data-testid="nav-logout-btn"
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
