'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Download, Newspaper, RefreshCw, Search, Users } from 'lucide-react';
import { ResultsGrid } from '@/components/results/ResultsGrid';
import { NewsDetailPanel } from '@/components/details/NewsDetailPanel';
import { CompanyDetailPanel } from '@/components/details/CompanyDetailPanel';
import { PeopleDetailPanel } from '@/components/details/PeopleDetailPanel';
import { companiesColumnDefs } from '@/lib/columns/companies';
import { peopleColumnDefs } from '@/lib/columns/people';
import { buildNewsColumnDefs } from '@/lib/news/schema';
import { useNewsSearch } from '@/hooks/useNewsSearch';
import { useCompaniesSearch } from '@/hooks/useCompaniesSearch';
import { usePeopleSearch } from '@/hooks/usePeopleSearch';
import type { CompanyRow, MatchStatus, NewsRow, PeopleRow } from '@/lib/types';

const NEWS_HEADERS = ['Title', 'Source', 'Date', 'Match', 'Significance', 'Relevance', 'Summary'];

type Scope = 'news' | 'companies' | 'people';

type TabConfig = {
  id: Scope;
  label: string;
  icon: typeof Newspaper;
};

const tabs: TabConfig[] = [
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'companies', label: 'Companies', icon: Building2 },
  { id: 'people', label: 'People', icon: Users },
];

const toNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const getScores = (scope: Scope, row: any) => {
  if (scope === 'news') {
    return {
      significance: toNumber(row?.Significance ?? row?.significance),
      relevance: toNumber(row?.Relevance ?? row?.relevance),
    };
  }

  return {
    significance: toNumber(row?.significance),
    relevance: toNumber(row?.relevance),
  };
};

const getMatchStatus = (scope: Scope, row: any): MatchStatus => {
  if (scope === 'news') {
    const status = row?.Match || row?.matchStatus;
    if (status === 'Match' || status === 'No Match' || status === 'Neutral') return status;
    return 'Neutral';
  }

  const status = row?.matchStatus;
  if (status === 'Match' || status === 'No Match' || status === 'Neutral') return status;
  return 'Neutral';
};

const filterRows = (
  scope: Scope,
  rows: any[],
  matchFilter: MatchStatus | 'All',
  significanceMin: number,
  relevanceMin: number
) => {
  return rows.filter((row) => {
    if (matchFilter !== 'All' && getMatchStatus(scope, row) !== matchFilter) {
      return false;
    }
    const scores = getScores(scope, row);
    return scores.significance >= significanceMin && scores.relevance >= relevanceMin;
  });
};

export default function Page() {
  const [activeTab, setActiveTab] = useState<Scope>('news');
  const [searchQuery, setSearchQuery] = useState('');
  const [matchFilter, setMatchFilter] = useState<MatchStatus | 'All'>('All');
  const [significanceMin, setSignificanceMin] = useState(0);
  const [relevanceMin, setRelevanceMin] = useState(0);
  const [selectedByScope, setSelectedByScope] = useState<Record<Scope, any | null>>({
    news: null,
    companies: null,
    people: null,
  });
  const [exportCsv, setExportCsv] = useState<(() => void) | null>(null);

  const { rows: newsSearchRows, loading: newsLoading, error: newsError, runSearch: runNewsSearch } = useNewsSearch();
  const {
    rows: companiesSearchRows,
    loading: companiesLoading,
    error: companiesError,
    runSearch: runCompaniesSearch,
  } = useCompaniesSearch();
  const { rows: peopleSearchRows, loading: peopleLoading, error: peopleError, runSearch: runPeopleSearch } = usePeopleSearch();

  const [newsRows, setNewsRows] = useState<NewsRow[]>([]);
  const [companyRows, setCompanyRows] = useState<CompanyRow[]>([]);
  const [peopleRows, setPeopleRows] = useState<PeopleRow[]>([]);

  useEffect(() => setNewsRows(newsSearchRows as NewsRow[]), [newsSearchRows]);
  useEffect(() => setCompanyRows(companiesSearchRows), [companiesSearchRows]);
  useEffect(() => setPeopleRows(peopleSearchRows), [peopleSearchRows]);

  const activeLoading = activeTab === 'news' ? newsLoading : activeTab === 'companies' ? companiesLoading : peopleLoading;
  const activeError = activeTab === 'news' ? newsError : activeTab === 'companies' ? companiesError : peopleError;

  const newsColumnDefs = useMemo(() => buildNewsColumnDefs(NEWS_HEADERS), []);
  const activeColumnDefs = useMemo(() => {
    if (activeTab === 'news') return newsColumnDefs;
    if (activeTab === 'companies') return companiesColumnDefs;
    return peopleColumnDefs;
  }, [activeTab, newsColumnDefs]);

  const registerExport = useCallback((exporter: () => void) => {
    setExportCsv(() => exporter);
  }, []);

  const scoreMax = activeTab === 'news' ? 5 : 100;
  const scoreStep = activeTab === 'news' ? 0.5 : 1;

  useEffect(() => {
    setSignificanceMin((prev) => Math.min(prev, scoreMax));
    setRelevanceMin((prev) => Math.min(prev, scoreMax));
  }, [scoreMax]);

  const filteredRowsByScope = useMemo(() => {
    return {
      news: filterRows('news', newsRows, matchFilter, significanceMin, relevanceMin),
      companies: filterRows('companies', companyRows, matchFilter, significanceMin, relevanceMin),
      people: filterRows('people', peopleRows, matchFilter, significanceMin, relevanceMin),
    };
  }, [newsRows, companyRows, peopleRows, matchFilter, significanceMin, relevanceMin]);

  const activeRows = filteredRowsByScope[activeTab];
  const selectedRow = selectedByScope[activeTab];

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setSelectedByScope((prev) => ({ ...prev, [activeTab]: null }));

    if (activeTab === 'news') {
      await runNewsSearch(searchQuery, 25);
      return;
    }

    if (activeTab === 'companies') {
      await runCompaniesSearch({ query: searchQuery, limit: 25 });
      return;
    }

    await runPeopleSearch({ query: searchQuery, limit: 25 });
  }, [activeTab, runCompaniesSearch, runNewsSearch, runPeopleSearch, searchQuery]);

  const handleExport = useCallback(() => {
    if (exportCsv) exportCsv();
  }, [exportCsv]);

  const handleRowSelect = useCallback(
    (row: any | null) => {
      setSelectedByScope((prev) => ({ ...prev, [activeTab]: row }));
    },
    [activeTab]
  );

  const resultCounts = useMemo(
    () => ({
      news: filteredRowsByScope.news.length,
      companies: filteredRowsByScope.companies.length,
      people: filteredRowsByScope.people.length,
    }),
    [filteredRowsByScope]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Getnius
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !activeLoading) handleSearch();
                  }}
                  placeholder="Describe your target market or person, e.g. 'AI sales copilots'"
                  className="w-full pl-12 pr-4 py-3.5 text-base border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all placeholder:text-gray-400"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={activeLoading || !searchQuery.trim()}
                className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-indigo-400 disabled:to-indigo-400 text-white rounded-xl font-semibold flex items-center gap-2.5 transition-all shadow-sm hover:shadow-md disabled:cursor-not-allowed min-w-[140px] justify-center"
              >
                {activeLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = resultCounts[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={
                  isActive
                    ? 'flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                }
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className={
                      isActive
                        ? 'px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white'
                        : 'px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600'
                    }
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 border-b border-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-2 flex-wrap">
                {(['Match', 'No Match', 'Neutral'] as MatchStatus[]).map((status) => {
                  const isActive = matchFilter === status;
                  return (
                    <button
                      key={status}
                      onClick={() => setMatchFilter(isActive ? 'All' : status)}
                      className={
                        isActive
                          ? 'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-indigo-600 text-white shadow-sm'
                          : 'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    >
                      {status}
                    </button>
                  );
                })}

                <div className="h-6 w-px bg-gray-200 mx-1" />

                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
                    Significance min {significanceMin}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={scoreMax}
                    step={scoreStep}
                    value={significanceMin}
                    onChange={(event) => setSignificanceMin(Number(event.target.value))}
                    className="w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
                    Relevance min {relevanceMin}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={scoreMax}
                    step={scoreStep}
                    value={relevanceMin}
                    onChange={(event) => setRelevanceMin(Number(event.target.value))}
                    className="w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>

              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </div>
          </div>

          {activeError && (
            <div className="px-4 py-2 bg-red-50 border-b border-red-100 text-red-700 text-sm">{activeError}</div>
          )}

          <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-4 p-4">
            <div className="min-w-0">
              <ResultsGrid
                scope={activeTab}
                rows={activeRows}
                columnDefs={activeColumnDefs}
                selectedRow={selectedRow}
                onRowSelect={handleRowSelect}
                onExportCsv={registerExport}
                loading={activeLoading}
              />
            </div>
            <div className="space-y-4">
              {activeTab === 'news' && <NewsDetailPanel row={selectedRow as NewsRow | null} />}
              {activeTab === 'companies' && <CompanyDetailPanel row={selectedRow as CompanyRow | null} />}
              {activeTab === 'people' && <PeopleDetailPanel row={selectedRow as PeopleRow | null} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
