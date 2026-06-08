"use client";

import { useState } from "react";
import type { FormField } from "@/types";

interface StructuredFormProps {
  fields: FormField[];
  totalCards: number;
  onSubmit: (values: Record<string, string>[]) => void;
  isDisabled?: boolean;
  partialValues?: Record<string, string>[];
}

export default function StructuredForm({
  fields,
  totalCards,
  onSubmit,
  isDisabled = false,
  partialValues,
}: StructuredFormProps) {
  const [cardValues, setCardValues] = useState<Record<string, string>[]>(
    partialValues?.length === totalCards
      ? partialValues
      : Array.from({ length: totalCards }, () => ({}))
  );
  const [errors, setErrors] = useState<Record<number, string>>({});

  const updateField = (cardIdx: number, key: string, value: string) => {
    setCardValues((prev) => {
      const updated = [...prev];
      updated[cardIdx] = { ...updated[cardIdx], [key]: value };
      return updated;
    });
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[cardIdx];
      return updated;
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<number, string> = {};
    for (let i = 0; i < totalCards; i++) {
      const card = cardValues[i] || {};
      const missing = fields.filter((f) => f.required && !card[f.key]?.trim());
      if (missing.length > 0) {
        newErrors[i] = `Missing required: ${missing.map((f) => f.label).join(", ")}`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isCardComplete = (cardIdx: number): boolean => {
    const card = cardValues[cardIdx] || {};
    return fields.every((f) => !f.required || !!card[f.key]?.trim());
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(cardValues);
    }
  };

  const allComplete = Array.from({ length: totalCards }, (_, i) => i).every(isCardComplete);

  return (
    <div data-testid="structured-form" className="mt-3 space-y-3">
      <div className={`grid gap-3 ${totalCards === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
        {Array.from({ length: totalCards }, (_, idx) => {
          const complete = isCardComplete(idx);
          return (
            <div
              key={idx}
              data-testid={`device-card-${idx + 1}`}
              className={`p-4 rounded-xl border-2 transition-colors ${
                complete ? "border-green-300 bg-green-50" : "border-gray-200 bg-white"
              } ${errors[idx] ? "border-red-300" : ""}`}
            >
              <h4 className="text-sm font-semibold text-gray-800 mb-3">
                {fields[0]?.label?.includes("Scanner")
                  ? `Scanner ${idx + 1}`
                  : `Device ${idx + 1}`}
              </h4>
              {fields.map((field) => (
                <div key={field.key} className="mb-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    data-testid={`form-field-${idx}-${field.key}`}
                    type="text"
                    value={cardValues[idx]?.[field.key] || ""}
                    onChange={(e) => updateField(idx, field.key, e.target.value)}
                    disabled={isDisabled}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-200 disabled:bg-gray-50 disabled:text-gray-400"
                    placeholder={field.label}
                  />
                </div>
              ))}
              {errors[idx] && (
                <p data-testid={`card-error-${idx}`} className="text-xs text-red-600 mt-1">
                  {errors[idx]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {!isDisabled && (
        <button
          data-testid="structured-form-submit"
          onClick={handleSubmit}
          disabled={!allComplete}
          className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Submit
        </button>
      )}
    </div>
  );
}
