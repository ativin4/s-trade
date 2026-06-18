interface NewsSummaryProps {
  summary: {
    summary: string
    keyPoints: string[]
    mentionedStocks: string[]
  }
}

export function NewsSummary({ summary }: NewsSummaryProps) {
  return (
    <div className="bg-[#0f1117] border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800">
        <p className="text-xs font-bold text-white uppercase tracking-widest">AI News Summary</p>
      </div>
      <div className="px-5 py-4">
        {!summary ? (
          <p className="text-sm text-slate-500">No news summary available.</p>
        ) : (
          <>
            <p className="text-sm text-slate-300 mb-4">{summary.summary}</p>
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest">Key Points</h4>
              <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
                {summary.keyPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
            {summary.mentionedStocks.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-2">Mentioned Stocks</h4>
                <div className="flex flex-wrap gap-2">
                  {summary.mentionedStocks.map((stock, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs font-medium"
                    >
                      {stock}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
