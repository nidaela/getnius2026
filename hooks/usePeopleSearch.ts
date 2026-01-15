import { useCallback, useState } from 'react';
import type { PeopleRow, SearchMeta } from '@/lib/types';

type PeopleSearchParams = {
  query: string;
  limit?: number;
  companyHint?: string;
};

type PeopleSearchState = {
  rows: PeopleRow[];
  meta: SearchMeta | null;
  loading: boolean;
  error: string | null;
  runSearch: (params: PeopleSearchParams) => Promise<void>;
};

export function usePeopleSearch(): PeopleSearchState {
  const [rows, setRows] = useState<PeopleRow[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async ({ query, limit = 25, companyHint }: PeopleSearchParams) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError('Please enter a search query.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/people/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmedQuery, limit, companyHint }),
      });

      if (!response.ok) {
        const message = `People search failed (${response.status}).`;
        throw new Error(message);
      }

      const data = await response.json();
      const nextRows = Array.isArray(data?.rows) ? (data.rows as PeopleRow[]) : [];
      setRows(nextRows);
      setMeta(data?.meta ?? null);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'People search failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { rows, meta, loading, error, runSearch };
}
