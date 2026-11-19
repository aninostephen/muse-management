import { Card } from '@astryxdesign/core/Card';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Stack } from '@astryxdesign/core/Stack';

export function LoadingSkeleton({
  variant = 'cards',
  count = 6,
}: {
  variant?: 'cards' | 'chart' | 'table';
  count?: number;
}) {
  if (variant === 'chart') {
    return (
      <Card padding={4} width="100%">
        <Stack direction="vertical" gap={3}>
          <Skeleton width="35%" height={20} index={0} />
          <Skeleton width="100%" height={280} index={1} />
        </Stack>
      </Card>
    );
  }

  if (variant === 'table') {
    return (
      <Card padding={4} width="100%">
        <Stack direction="vertical" gap={2}>
          <Skeleton width="40%" height={24} index={0} />
          {Array.from({ length: count }).map((_, idx) => (
            <Skeleton
              key={idx}
              width="100%"
              height={38}
              index={idx + 1}
              radius={2}
            />
          ))}
        </Stack>
      </Card>
    );
  }

  return (
    <div className="kpi-grid">
      {Array.from({ length: count }).map((_, idx) => (
        <Card key={idx} padding={4}>
          <Stack direction="vertical" gap={2}>
            <Skeleton width="55%" height={16} index={idx} />
            <Skeleton width="80%" height={28} index={idx + 1} />
            <Skeleton width="45%" height={14} index={idx + 2} />
          </Stack>
        </Card>
      ))}
    </div>
  );
}
