import type { ColDef } from 'ag-grid-community';
import type { PeopleRow } from '@/lib/types';

const MatchStatusRenderer = (params: { value?: PeopleRow['matchStatus'] }) => {
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

const PersonRenderer = (params: { data?: PeopleRow }) => {
  const name = params.data?.personName || 'Unknown Person';
  const company = params.data?.company;

  return (
    <div className="flex flex-col min-w-0">
      <span className="text-sm font-semibold text-gray-900 truncate">{name}</span>
      <span className="text-xs text-gray-500 truncate">{company || 'No company listed'}</span>
    </div>
  );
};

const formatScore = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0';
  return value.toFixed(0);
};

export const peopleColumnDefs: ColDef[] = [
  {
    field: 'personName',
    headerName: 'Person',
    minWidth: 200,
    flex: 1,
    pinned: 'left',
    cellRenderer: PersonRenderer,
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
    headerName: 'Summary',
    minWidth: 240,
    flex: 1.4,
    valueGetter: (params) => {
      const role = params.data?.role || '';
      const company = params.data?.company || '';
      if (role && company) return `${role} at ${company}`;
      return role || company || 'No summary';
    },
  },
];
