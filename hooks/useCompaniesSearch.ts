import { useCallback, useState } from 'react';
import type { CompanyRow, SearchMeta } from '@/lib/types';

type CompaniesSearchParams = {
  query: string;
  limit?: number;
  regions?: string[];
  keywords?: string[];
};

type CompaniesSearchState = {
  rows: CompanyRow[];
  meta: SearchMeta | null;
  loading: boolean;
  error: string | null;
  runSearch: (params: CompaniesSearchParams) => Promise<void>;
};

export function useCompaniesSearch(): CompaniesSearchState {
  const [rows, setRows] = useState<CompanyRow[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async ({ query, limit = 25, regions, keywords }: CompaniesSearchParams) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError('Please enter a search query.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/companies/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmedQuery, limit, regions, keywords }),
      });

      if (!response.ok) {
        const message = `Company search failed (${response.status}).`;
        throw new Error(message);
      }

      const data = await response.json();
      const nextRows = Array.isArray(data?.rows) ? (data.rows as CompanyRow[]) : [];
      setRows(nextRows);
      setMeta(data?.meta ?? null);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Company search failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { rows, meta, loading, error, runSearch };
}
