'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ColDef, GridReadyEvent } from 'ag-grid-community';
import { AgGridWrapper, AgGridWrapperRef } from '@/components/ui/ag-grid-wrapper';

export type ResultsScope = 'news' | 'companies' | 'people';

type ResultsGridProps = {
  scope: ResultsScope;
  rows: any[];
  columnDefs: ColDef[];
  selectedRow: any | null;
  onRowSelect: (row: any | null) => void;
  onExportCsv?: (exporter: () => void) => void;
  loading?: boolean;
};

const resolveRowId = (scope: ResultsScope, row: any) => {
  if (!row) return '';
  if (row.id) return String(row.id);
  if (scope === 'news') {
    return String(
      row.URL ||
        row.Url ||
        row.url ||
        row.Title ||
        row.title ||
        row.Source ||
        row.source ||
        ''
    );
  }
  return String(row.website || row.profileUrl || row.companyName || row.personName || '');
};

export function ResultsGrid({
  scope,
  rows,
  columnDefs,
  selectedRow,
  onRowSelect,
  onExportCsv,
  loading = false,
}: ResultsGridProps) {
  const gridRef = useRef<AgGridWrapperRef>(null);

  const getRowId = useCallback(
    (params: { data: any }) => resolveRowId(scope, params.data),
    [scope]
  );

  const handleSelectionChanged = useCallback(
    (selectedRows: any[]) => {
      onRowSelect(selectedRows[0] ?? null);
    },
    [onRowSelect]
  );

  const handleGridReady = useCallback(
    (event: GridReadyEvent) => {
      if (onExportCsv) {
        onExportCsv(() => event.api.exportDataAsCsv());
      }
    },
    [onExportCsv]
  );

  useEffect(() => {
    if (!gridRef.current?.api) return;
    const api = gridRef.current.api;
    if (!selectedRow) {
      api.deselectAll();
      return;
    }
    const rowId = resolveRowId(scope, selectedRow);
    if (!rowId) return;
    const rowNode = api.getRowNode(rowId);
    if (rowNode) {
      rowNode.setSelected(true, true);
    }
  }, [selectedRow, scope]);

  const getRowClass = useCallback(
    (params: { data?: any }) => {
      const matchStatus =
        scope === 'news'
          ? params.data?.Match || params.data?.matchStatus
          : params.data?.matchStatus;

      if (matchStatus === 'Match') return 'row-match';
      if (matchStatus === 'No Match') return 'row-not-match';
      return '';
    },
    [scope]
  );

  const emptyMessage = useMemo(() => {
    switch (scope) {
      case 'companies':
        return 'No companies found. Run a search to populate results.';
      case 'people':
        return 'No people found. Run a search to populate results.';
      default:
        return 'No news found. Run a search to populate results.';
    }
  }, [scope]);

  return (
    <AgGridWrapper
      ref={gridRef}
      rowData={rows}
      columnDefs={columnDefs}
      height="calc(100vh - 360px)"
      loading={loading}
      onSelectionChanged={handleSelectionChanged}
      rowSelection="single"
      checkboxSelection={false}
      pagination={true}
      paginationPageSize={20}
      emptyMessage={emptyMessage}
      getRowId={getRowId}
      getRowClass={getRowClass}
      onGridReady={handleGridReady}
    />
  );
}
