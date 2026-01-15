import type { ColDef } from 'ag-grid-community';
import type { CompanyRow } from '@/lib/types';

const MatchStatusRenderer = (params: { value?: CompanyRow['matchStatus'] }) => {
  const status = params.value || 'Neutral';
  const colorMap: Record<string, string> = {
    Match: 'bg-green-100 text-green-700 border-green-200',
    'No Match': 'bg-red-100 text-red-700 border-red-200',
    Neutral: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  const colorClass = colorMap[status] || colorMap.Neutral;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {status}
    </span>
  );
};

const CompanyRenderer = (params: { data?: CompanyRow }) => {
  const name = params.data?.companyName || 'Unknown Company';
  const website = params.data?.website || '';
  const domain = website.replace(/^https?:\/\//, '').replace(/\/.*/, '');

  return (
    <div className="flex flex-col min-w-0">
      <span className="text-sm font-semibold text-gray-900 truncate">{name}</span>
      {website ? (
        <a
          href={website}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-indigo-600 hover:underline truncate"
          onClick={(event) => event.stopPropagation()}
        >
          {domain}
        </a>
      ) : (
        <span className="text-xs text-gray-400">No website</span>
      )}
    </div>
  );
};

const formatScore = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0';
  return value.toFixed(0);
};

export const companiesColumnDefs: ColDef[] = [
  {
    field: 'companyName',
    headerName: 'Company',
    minWidth: 220,
    flex: 1.2,
    pinned: 'left',
    cellRenderer: CompanyRenderer,
  },
  {
    field: 'source',
    headerName: 'Source',
    width: 110,
    valueFormatter: (params) => params.value || 'N/A',
  },
  {
    field: 'date',
    headerName: 'Date',
    width: 120,
    valueFormatter: (params) => params.value || 'N/A',
  },
  {
    field: 'matchStatus',
    headerName: 'Match',
    width: 120,
    cellRenderer: MatchStatusRenderer,
  },
  {
    field: 'significance',
    headerName: 'Significance',
    width: 120,
    valueFormatter: (params) => formatScore(params.value),
    cellClass: 'ag-right-aligned-cell',
  },
  {
    field: 'relevance',
    headerName: 'Relevance',
    width: 110,
    valueFormatter: (params) => formatScore(params.value),
    cellClass: 'ag-right-aligned-cell',
  },
  {
    field: 'description',
    headerName: 'Summary',
    minWidth: 260,
    flex: 1.4,
    valueFormatter: (params) => params.value || 'No summary',
  },
];
