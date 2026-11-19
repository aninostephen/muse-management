import type { ReactNode } from 'react';
import { Card } from '@astryxdesign/core/Card';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Stack } from '@astryxdesign/core/Stack';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { PaginationMeta } from '../../types/api.types';
import { EmptyState } from '../ui/EmptyState';
import { PaginationBar } from '../ui/PaginationBar';

export interface DataTableColumn<
  TRow,
  TSortField extends string = string,
> {
  /** Unique column identifier */
  key: string;
  /** Column header label or custom node */
  header: ReactNode;
  /** Optional sort field key; makes the column header clickable & sortable */
  sortKey?: TSortField;
  /** Direct property accessor on TRow when `render` is not provided */
  accessor?: keyof TRow;
  /** Custom cell renderer for each row */
  render?: (row: TRow, rowIndex: number) => ReactNode;
  /** Pins this column to the right edge (`position: sticky; right: 0`) for action buttons */
  stickyRight?: boolean;
  /** Prevents clicking buttons inside this cell from triggering `onRowClick` (defaults to `true` when `stickyRight` is set) */
  stopRowClickPropagation?: boolean;
  /** Optional text alignment */
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<
  TRow,
  TSortField extends string = string,
> {
  /** Array of column definitions */
  columns: DataTableColumn<TRow, TSortField>[];
  /** Array of row objects */
  rows: TRow[];
  /** Property key or function to produce a unique React key per row */
  rowKey: keyof TRow | ((row: TRow, index: number) => string | number);
  /** Active sort field */
  sortBy?: TSortField;
  /** Active sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Callback fired when a sortable column header is clicked */
  onSortChange?: (field: TSortField) => void;
  /** Optional callback fired when a row is clicked */
  onRowClick?: (row: TRow) => void;
  /** Optional pagination metadata (`page`, `limit`, `total`, `totalPages`) */
  meta?: PaginationMeta;
  /** Callback fired when pagination page changes */
  onPageChange?: (page: number) => void;
  /** Plural noun used in the pagination footer (e.g. "creators", "chatters", "transactions") */
  itemLabel?: string;
  /** Indicates a background refetch (page change, sort, filter, or date update) is in-flight */
  isFetching?: boolean;
  /** Empty state title when `rows.length === 0` */
  emptyTitle?: string;
  /** Empty state description when `rows.length === 0` */
  emptyDescription?: string;
  /** Wrap table in an Astryx Card container (default: `true`) */
  withCard?: boolean;
}

export function DataTable<
  TRow,
  TSortField extends string = string,
>({
  columns,
  rows,
  rowKey,
  sortBy,
  sortOrder = 'desc',
  onSortChange,
  onRowClick,
  meta,
  onPageChange,
  itemLabel = 'records',
  isFetching = false,
  emptyTitle = 'No records found',
  emptyDescription = 'No items matched your current filters or date range.',
  withCard = true,
}: DataTableProps<TRow, TSortField>) {
  const renderSortIcon = (field: TSortField) => {
    if (sortBy !== field) return <ArrowUpDown size={13} />;
    return sortOrder === 'asc' ? (
      <ArrowUp size={13} />
    ) : (
      <ArrowDown size={13} />
    );
  };

  const getRowKey = (row: TRow, index: number): string | number => {
    if (typeof rowKey === 'function') {
      return rowKey(row, index);
    }
    const val = row[rowKey];
    return val !== undefined && val !== null ? String(val) : index;
  };

  if (rows.length === 0 && !isFetching) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  const content = (
    <div className="data-table-container">
      {isFetching && (
        <>
          <div className="fetching-progress-track">
            <div className="fetching-progress-bar" />
          </div>
          <div className="data-table-fetching-pill">
            <Spinner size="sm" label="Updating table data" />
            <span>Updating data...</span>
          </div>
        </>
      )}

      <div
        className={`data-table-wrapper ${isFetching ? 'is-fetching' : ''}`}
      >
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => {
                const isSortable = Boolean(col.sortKey && onSortChange);
                const thClasses = [
                  isSortable ? 'sortable' : '',
                  col.stickyRight ? 'sticky-action-col' : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <th
                    key={col.key}
                    className={thClasses || undefined}
                    style={col.align ? { textAlign: col.align } : undefined}
                    onClick={
                      isSortable && col.sortKey && !isFetching
                        ? () => onSortChange?.(col.sortKey!)
                        : undefined
                    }
                  >
                    {isSortable && col.sortKey ? (
                      <Stack direction="horizontal" gap={1} align="center">
                        <span>{col.header}</span>
                        {renderSortIcon(col.sortKey)}
                      </Stack>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={getRowKey(row, rowIndex)}
                className={onRowClick ? 'clickable-row' : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => {
                  const shouldStopPropagation =
                    col.stopRowClickPropagation ?? Boolean(col.stickyRight);

                  let cellContent: ReactNode = null;
                  if (col.render) {
                    cellContent = col.render(row, rowIndex);
                  } else if (col.accessor !== undefined) {
                    const rawVal = row[col.accessor];
                    cellContent =
                      rawVal !== undefined && rawVal !== null
                        ? String(rawVal)
                        : '';
                  }

                  return (
                    <td
                      key={col.key}
                      className={
                        col.stickyRight ? 'sticky-action-col' : undefined
                      }
                      style={col.align ? { textAlign: col.align } : undefined}
                      onClick={
                        shouldStopPropagation
                          ? (e) => e.stopPropagation()
                          : undefined
                      }
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginationBar
        meta={meta}
        onPageChange={onPageChange}
        itemLabel={itemLabel}
        isLoading={isFetching}
      />
    </div>
  );

  if (!withCard) {
    return content;
  }

  return (
    <Card padding={0} width="100%">
      {content}
    </Card>
  );
}
