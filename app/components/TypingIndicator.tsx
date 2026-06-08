"use client";

export default function TypingIndicator() {
  return (
    <div data-testid="typing-indicator" className="flex items-start gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
        P
      </div>
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm border-l-2 border-l-red-600">
        <div className="flex gap-1 items-center h-5">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
