import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function ErrorState({
  title = 'Failed to load analytics data',
  error,
  onRetry,
  isRetrying = false,
}: ErrorStateProps) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'An error occurred while fetching data from the backend API.';

  return (
    <Banner
      status="error"
      title={title}
      description={message}
      role="alert"
      endContent={
        onRetry ? (
          <Button
            label={isRetrying ? 'Retrying...' : 'Retry'}
            variant="secondary"
            size="sm"
            isLoading={isRetrying}
            icon={<RefreshCw size={14} />}
            onClick={onRetry}
          />
        ) : undefined
      }
    />
  );
}
