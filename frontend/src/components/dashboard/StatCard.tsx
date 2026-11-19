import type { ReactNode } from 'react';
import { Badge, type BadgeVariant } from '@astryxdesign/core/Badge';
import { Card, type CardVariant } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  badgeLabel?: string;
  badgeVariant?: BadgeVariant;
  cardVariant?: CardVariant;
  isUnavailable?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  badgeLabel,
  badgeVariant = 'neutral',
  cardVariant = 'default',
  isUnavailable = false,
}: StatCardProps) {
  return (
    <Card padding={4} variant={cardVariant} elevation="none">
      <Stack direction="vertical" gap={2} justify="between" height="100%">
        <Stack direction="horizontal" justify="between" align="center">
          <Text type="label" color="secondary" weight="medium">
            {title}
          </Text>
          {icon && (
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--dashboard-hover)',
                color: 'var(--dashboard-accent)',
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
          )}
        </Stack>

        <Stack direction="vertical" gap={1}>
          <Heading
            level={2}
            color={isUnavailable ? 'secondary' : 'primary'}
          >
            {value}
          </Heading>

          {(subtitle || badgeLabel) && (
            <Stack
              direction="horizontal"
              gap={1.5}
              align="center"
              wrap="wrap"
            >
              {badgeLabel && (
                <Badge label={badgeLabel} variant={badgeVariant} />
              )}
              {subtitle && <Text type="supporting">{subtitle}</Text>}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}
