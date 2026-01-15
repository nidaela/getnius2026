import type { CompanyRow } from '@/lib/types';

export function CompanyDetailPanel({ row }: { row: CompanyRow | null }) {
  if (!row) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-sm text-gray-500">
        Select a company to see details.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-gray-900">{row.companyName || 'Unknown Company'}</h2>
        {row.website ? (
          <a
            href={row.website}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-indigo-600 hover:underline break-all"
          >
            {row.website}
          </a>
        ) : (
          <p className="text-sm text-gray-400">No website available</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs uppercase text-gray-400">Source</p>
          <p className="font-medium text-gray-700">{row.source || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-400">Date</p>
          <p className="font-medium text-gray-700">{row.date || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-400">Match</p>
          <p className="font-medium text-gray-700">{row.matchStatus || 'Neutral'}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-400">Significance</p>
          <p className="font-medium text-gray-700">{row.significance ?? 0}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-400">Relevance</p>
          <p className="font-medium text-gray-700">{row.relevance ?? 0}</p>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase text-gray-400">Summary</p>
        <p className="text-sm text-gray-700 whitespace-pre-line">{row.description || 'No summary provided.'}</p>
      </div>
    </div>
  );
}
