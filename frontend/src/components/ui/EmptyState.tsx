import type { ReactNode } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { EmptyState as AstryxEmptyState } from '@astryxdesign/core/EmptyState';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Card padding={6} width="100%">
      <AstryxEmptyState
        title={title}
        description={description}
        icon={icon ?? <Inbox size={32} />}
        actions={
          actionLabel && onAction ? (
            <Button
              label={actionLabel}
              variant="secondary"
              size="sm"
              onClick={onAction}
            />
          ) : undefined
        }
      />
    </Card>
  );
}
