"use client";

import type { ChatMessage } from "@/types";

interface MessageBubbleProps {
  message: ChatMessage;
  readonly?: boolean;
  onOptionSelect?: (option: string) => void;
}

function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Image tag
    const imgMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgMatch) {
      const filename = imgMatch[2];
      const src = filename.startsWith("http")
        ? filename
        : `/api/kb-image/${encodeURIComponent(filename)}`;
      result.push(
        <img
          key={i}
          src={src}
          alt={imgMatch[1]}
          className="max-w-full rounded-lg my-2"
          onError={(e) => {
            console.error(`[MessageBubble] Image not found: ${filename}`);
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      );
      i++;
      continue;
    }

    // Headings
    const h2 = line.match(/^## (.+)/);
    if (h2) {
      result.push(<h2 key={i} className="text-base font-semibold mt-3 mb-1">{h2[1]}</h2>);
      i++;
      continue;
    }
    const h3 = line.match(/^### (.+)/);
    if (h3) {
      result.push(<h3 key={i} className="text-sm font-semibold mt-2 mb-1">{h3[1]}</h3>);
      i++;
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(<li key={i} className="ml-4">{renderInline(lines[i].replace(/^\d+\. /, ""))}</li>);
        i++;
      }
      result.push(<ol key={`ol-${i}`} className="list-decimal list-inside space-y-1 my-1">{items}</ol>);
      continue;
    }

    // Unordered list
    if (/^[-*] /.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(<li key={i} className="ml-4">{renderInline(lines[i].replace(/^[-*] /, ""))}</li>);
        i++;
      }
      result.push(<ul key={`ul-${i}`} className="list-disc list-inside space-y-1 my-1">{items}</ul>);
      continue;
    }

    // Bold/emphasis inline
    if (line.trim()) {
      result.push(<p key={i} className="mb-1">{renderInline(line)}</p>);
    } else {
      result.push(<br key={i} />);
    }
    i++;
  }
  return result;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={idx} className="bg-gray-100 px-1 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export default function MessageBubble({
  message,
  readonly = false,
  onOptionSelect,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const controls = message.controls;
  const isPending = controls?.status === "pending" && !readonly;

  return (
    <div
      data-testid={`message-bubble-${message.role}`}
      className={`flex items-start gap-3 mb-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          isUser ? "bg-gray-200 text-gray-700" : "bg-red-600 text-white"
        }`}
      >
        {isUser ? "U" : "P"}
      </div>

      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-2`}>
        <div
          className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${
            isUser
              ? "bg-red-600 text-white rounded-tr-sm"
              : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm border-l-2 border-l-red-600"
          }`}
        >
          {isUser ? (
            <span>{message.content}</span>
          ) : (
            <div className="prose prose-sm max-w-none">
              {parseMarkdown(message.content)}
            </div>
          )}
        </div>

        {/* Dynamic controls */}
        {controls && (
          <div data-testid="dynamic-controls" className="w-full">
            {isPending && controls.type === "buttons" && controls.options && (
              <div className="flex flex-wrap gap-2 mt-1">
                {controls.options.map((opt) => (
                  <button
                    key={opt}
                    data-testid={`option-btn-${opt.replace(/\s+/g, "-").toLowerCase()}`}
                    onClick={() => onOptionSelect?.(opt)}
                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {isPending && controls.type === "select" && controls.options && (
              <SelectControl options={controls.options} onSelect={onOptionSelect} />
            )}

            {!isPending && controls.options && controls.answered_value && (
              <div className="flex flex-wrap gap-2 mt-1">
                {controls.options.map((opt) => (
                  <span
                    key={opt}
                    className={`px-3 py-1.5 text-sm rounded-lg border ${
                      opt === controls.answered_value
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-gray-50 text-gray-400 border-gray-200 line-through"
                    }`}
                  >
                    {opt}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SelectControl({
  options,
  onSelect,
}: {
  options: string[];
  onSelect?: (opt: string) => void;
}) {
  return (
    <div className="mt-2 flex gap-2">
      <select
        data-testid="select-control"
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-600 flex-1"
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) onSelect?.(e.target.value);
        }}
      >
        <option value="" disabled>Select an option…</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
