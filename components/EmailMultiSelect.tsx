"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

type Props = {
  value: string[];
  onChange: (emails: string[]) => void;
};

export function EmailMultiSelect({ value, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setIndex(0);
      return;
    }

    const controller = new AbortController();

    fetch(`/api/users/search?email=${query}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: string[]) => {
        // 🚫 Filter already selected emails
        const filtered = data.filter(
          (email) => !value.includes(email)
        );

        setSuggestions(filtered);
        setIndex(0);
      })
      .catch(() => {});

    return () => controller.abort();
  }, [query, value]);

  function addEmail(email: string) {
    if (!value.includes(email)) {
      onChange([...value, email]);
    }
    setQuery("");
    setSuggestions([]);
    setIndex(0);
  }

  function removeEmail(email: string) {
    onChange(value.filter((e) => e !== email));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && suggestions[index]) {
      e.preventDefault();
      addEmail(suggestions[index]);
    }

    if (e.key === "ArrowDown") {
      setIndex((i) => Math.min(i + 1, suggestions.length - 1));
    }

    if (e.key === "ArrowUp") {
      setIndex((i) => Math.max(i - 1, 0));
    }
  }

  return (
    <div className="border rounded p-2 space-y-2">
      {/* Tags + Input container */}
      <div className="flex flex-wrap gap-2 items-center">
        {value.map((email) => (
          <span
            key={email}
            className="bg-muted px-2 py-1 rounded flex items-center gap-1"
          >
            {email}
            <button
              type="button"
              onClick={() => removeEmail(email)}
              className="hover:text-red-500"
            >
              <X size={14} />
            </button>
          </span>
        ))}

        {/* Input always stays on new line if space not enough */}
        <div className="flex-1 min-w-[220]">
          <Input
            placeholder="Type user email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="border rounded bg-background max-h-40 overflow-y-auto">
          {suggestions.map((email, i) => (
            <div
              key={email}
              className={`px-3 py-2 cursor-pointer ${
                i === index ? "bg-muted" : ""
              }`}
              onClick={() => addEmail(email)}
            >
              {email}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
