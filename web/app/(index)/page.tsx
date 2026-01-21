"use client";
import { useAnalyze } from "@/hooks/use-analyze";
import { AnalyzeOutput } from "./_components/analyzeOutput";
import { useEffect } from "react";

export default function AnalyzePage() {
  const { inputValue, setInputValue, analyze, loading, error, result } =
    useAnalyze();

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <h1 className="text-3xl font-semibold mb-2">Анализ пользователя</h1>
        <p className="text-neutral-400 mb-6">
          AI-анализ стиля общения, эмоций и поведения
        </p>

        {/* Input card */}
        <div className="rounded-2xl bg-neutral-800 border border-neutral-700 p-4 shadow">
          <div className="flex gap-3">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Введите username"
              className="
                flex-1 rounded-lg bg-neutral-900 border border-neutral-700
                px-4 py-2 text-neutral-100
                placeholder-neutral-500
                focus:outline-none focus:ring-2 focus:ring-indigo-500/40
              "
            />

            <button
              onClick={() => analyze()}
              disabled={loading}
              className="
                rounded-lg bg-indigo-600 text-white px-6 py-2
                hover:bg-indigo-500 transition
                disabled:opacity-50
              "
            >
              {loading ? "Анализ..." : "Анализировать"}
            </button>
          </div>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </div>

        {result && <AnalyzeOutput text={result.analysis} />}
      </div>
    </div>
  );
}
