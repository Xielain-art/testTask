import { useState } from "react";
import { AnalyzeResult, ErrorResult } from "../types/analyze.types";

export const useAnalyze = () => {
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (limit = 80) => {
    if (!inputValue.trim()) {
      setError("Введите имя пользователя");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `/api/analyze?username=${encodeURIComponent(inputValue)}&limit=${limit}`,
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Ошибка анализа");
      }

      const data: AnalyzeResult = await response.json();
      setResult(data);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Произошла ошибка при анализе");
    } finally {
      setLoading(false);
    }
  };

  return {
    inputValue,
    setInputValue,
    result,
    loading,
    error,
    analyze,
  };
};
