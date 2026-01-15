import type { NewsRow } from '@/lib/types';

const getField = (row: NewsRow | null, keys: string[], fallback = 'N/A') => {
  if (!row) return fallback;
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return fallback;
};

export function NewsDetailPanel({ row }: { row: NewsRow | null }) {
  const title = getField(row, ['Title', 'title'], 'Untitled');
  const url = getField(row, ['URL', 'Url', 'url'], '');
  const source = getField(row, ['Source', 'source']);
  const date = getField(row, ['Date', 'date']);
  const summary = getField(row, ['Summary', 'summary', 'Description', 'description'], 'No summary provided.');
  const match = getField(row, ['Match', 'matchStatus'], 'Neutral');
  const significance = getField(row, ['Significance', 'significance'], '0');
  const relevance = getField(row, ['Relevance', 'relevance'], '0');

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-indigo-600 hover:underline break-all"
          >
            {url}
          </a>
        ) : (
          <p className="text-sm text-gray-400">No URL available</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs uppercase text-gray-400">Source</p>
          <p className="font-medium text-gray-700">{source}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-400">Date</p>
          <p className="font-medium text-gray-700">{date}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-400">Match</p>
          <p className="font-medium text-gray-700">{match}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-400">Significance</p>
          <p className="font-medium text-gray-700">{significance}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-400">Relevance</p>
          <p className="font-medium text-gray-700">{relevance}</p>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase text-gray-400">Summary</p>
        <p className="text-sm text-gray-700 whitespace-pre-line">{summary}</p>
      </div>
    </div>
  );
}
