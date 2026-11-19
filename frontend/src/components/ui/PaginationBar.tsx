import { Button } from '@astryxdesign/core/Button';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '../../types/api.types';

interface PaginationBarProps {
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  itemLabel?: string;
  isLoading?: boolean;
}

export function PaginationBar({
  meta,
  onPageChange,
  itemLabel = 'records',
  isLoading = false,
}: PaginationBarProps) {
  if (!meta || meta.total === 0) return null;

  const { page, limit, total, totalPages } = meta;
  const startItem = Math.min(total, (page - 1) * limit + 1);
  const endItem = Math.min(total, page * limit);

  // Build visible page number window (up to 5 numbered buttons around current page)
  const pageNumbers: number[] = [];
  const maxButtons = 5;
  let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
  const endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }
  for (let p = startPage; p <= endPage; p += 1) {
    pageNumbers.push(p);
  }

  return (
    <div
      style={{
        borderTop: '1px solid var(--dashboard-border)',
      }}
    >
      <Stack
        direction="horizontal"
        justify="between"
        align="center"
        wrap="wrap"
        gap={2}
        padding={3}
      >
        <Stack direction="horizontal" gap={1.5} align="center">
          <Text type="supporting">
            Showing {startItem}–{endItem} of {total} {itemLabel} • Page {page}{' '}
            of {totalPages} ({limit} per page)
          </Text>
          {isLoading && (
            <Stack direction="horizontal" gap={1} align="center">
              <Spinner size="sm" label="Loading page" />
              <Text type="supporting">Updating...</Text>
            </Stack>
          )}
        </Stack>

        {onPageChange && (
          <Stack direction="horizontal" gap={1} align="center">
            <Button
              label="Previous"
              size="sm"
              variant="secondary"
              isDisabled={isLoading || page <= 1}
              icon={<ChevronLeft size={14} />}
              onClick={() => onPageChange(page - 1)}
            />

            {pageNumbers.map((p) => (
              <Button
                key={p}
                label={String(p)}
                size="sm"
                variant={p === page ? 'primary' : 'ghost'}
                isLoading={isLoading && p === page}
                isDisabled={isLoading}
                onClick={() => {
                  if (p !== page) onPageChange(p);
                }}
              />
            ))}

            <Button
              label="Next"
              size="sm"
              variant="secondary"
              isDisabled={isLoading || page >= totalPages}
              endContent={<ChevronRight size={14} />}
              onClick={() => onPageChange(page + 1)}
            />
          </Stack>
        )}
      </Stack>
    </div>
  );
}
