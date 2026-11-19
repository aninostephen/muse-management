import { Button } from '@astryxdesign/core/Button';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Calendar } from 'lucide-react';
import type { DateRangeFilter } from '../../types/api.types';

interface DateRangePickerProps {
  value: DateRangeFilter;
  onChange: (next: DateRangeFilter) => void;
  isLoading?: boolean;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function getPresetDateRange(days: number): DateRangeFilter {
  const end = new Date();
  const start = new Date(end.getTime() - (days - 1) * 86400 * 1000);
  return {
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
  };
}

const PRESETS = [
  { days: 7, label: '7D', tooltip: 'Last 7 days' },
  { days: 14, label: '14D', tooltip: 'Last 14 days' },
  { days: 30, label: '30D', tooltip: 'Last 30 days (Infloww single window)' },
  {
    days: 90,
    label: '90D',
    tooltip: 'Last 90 days (auto-chunked into 30-day windows)',
  },
] as const;

export function DateRangePicker({
  value,
  onChange,
  isLoading = false,
}: DateRangePickerProps) {
  const applyPreset = (days: number) => {
    onChange(getPresetDateRange(days));
  };

  const isPresetActive = (days: number): boolean => {
    const preset = getPresetDateRange(days);
    return (
      value.startDate === preset.startDate && value.endDate === preset.endDate
    );
  };

  return (
    <Stack direction="horizontal" gap={1.5} align="center" wrap="wrap">
      <Stack direction="horizontal" gap={1} align="center">
        <Calendar size={15} style={{ color: 'var(--dashboard-muted)' }} />
        {PRESETS.map((p) => {
          const active = isPresetActive(p.days);
          return (
            <Button
              key={p.days}
              label={p.label}
              size="sm"
              variant={active ? 'primary' : 'ghost'}
              isLoading={isLoading && active}
              isDisabled={isLoading}
              onClick={() => applyPreset(p.days)}
              tooltip={p.tooltip}
            />
          );
        })}
      </Stack>

      <Stack direction="horizontal" gap={1} align="center">
        <input
          type="date"
          aria-label="Start Date"
          disabled={isLoading}
          value={value.startDate || ''}
          max={value.endDate || undefined}
          onChange={(e) =>
            onChange({
              ...value,
              startDate: e.target.value || undefined,
            })
          }
          style={{
            height: 28,
            padding: '0 8px',
            borderRadius: 6,
            border: '1px solid var(--dashboard-border)',
            backgroundColor: 'var(--dashboard-surface)',
            color: 'inherit',
            fontSize: 12.5,
            opacity: isLoading ? 0.65 : 1,
          }}
        />
        <Text type="supporting">to</Text>
        <input
          type="date"
          aria-label="End Date"
          disabled={isLoading}
          value={value.endDate || ''}
          min={value.startDate || undefined}
          onChange={(e) =>
            onChange({
              ...value,
              endDate: e.target.value || undefined,
            })
          }
          style={{
            height: 28,
            padding: '0 8px',
            borderRadius: 6,
            border: '1px solid var(--dashboard-border)',
            backgroundColor: 'var(--dashboard-surface)',
            color: 'inherit',
            fontSize: 12.5,
            opacity: isLoading ? 0.65 : 1,
          }}
        />
      </Stack>
    </Stack>
  );
}
