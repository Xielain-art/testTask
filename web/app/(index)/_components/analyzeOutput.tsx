import ReactMarkdown from "react-markdown";

type Props = {
  text: string;
};

// простейший анализ из текста
function getToxicityLevel(text: string) {
  if (text.includes("низкий"))
    return { label: "Низкий", value: 20, color: "bg-green-500" };
  if (text.includes("средний"))
    return { label: "Средний", value: 55, color: "bg-yellow-500" };
  if (text.includes("высокий"))
    return { label: "Высокий", value: 85, color: "bg-red-500" };
  return { label: "Не определён", value: 10, color: "bg-neutral-500" };
}

const emotions = [
  { label: "Позитив", color: "bg-green-500" },
  { label: "Раздражение", color: "bg-yellow-500" },
  { label: "Нейтральность", color: "bg-blue-500" },
];

export function AnalyzeOutput({ text }: Props) {
  const toxicity = getToxicityLevel(text);

  return (
    <div className="mt-8 rounded-2xl bg-neutral-800 border border-neutral-700 shadow-lg">
      {/* Header */}
      <div className="border-b border-neutral-700 px-6 py-4">
        <h2 className="text-xl font-semibold">📊 Результат анализа</h2>
      </div>

      {/* Visual stats */}
      <div className="px-6 py-5 grid gap-5 md:grid-cols-2">
        {/* Emotions */}
        <div>
          <p className="text-sm text-neutral-400 mb-2">Эмоциональный фон</p>
          <div className="flex gap-2 flex-wrap">
            {emotions.map((e) => (
              <span
                key={e.label}
                className={`px-3 py-1 text-sm rounded-full text-white ${e.color}`}
              >
                {e.label}
              </span>
            ))}
          </div>
        </div>

        {/* Toxicity */}
        <div>
          <p className="text-sm text-neutral-400 mb-2">
            Уровень токсичности: <b>{toxicity.label}</b>
          </p>
          <div className="h-3 rounded-full bg-neutral-700 overflow-hidden">
            <div
              className={`h-full ${toxicity.color}`}
              style={{ width: `${toxicity.value}%` }}
            />
          </div>
        </div>
      </div>

      {/* Markdown */}
      <article className="prose prose-invert max-w-none px-6 pb-6">
        <ReactMarkdown
          components={{
            strong: ({ children }) => (
              <strong className="text-white bg-indigo-600/30 px-1 rounded">
                {children}
              </strong>
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      </article>
    </div>
  );
}
