import { useEffect, useState } from 'react';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Stack } from '@astryxdesign/core/Stack';
import { useQueryClient } from '@tanstack/react-query';
import { getPresetDateRange } from './components/ui/DateRangePicker';
import {
  DashboardLayout,
  type NavTabId,
} from './layouts/DashboardLayout';
import { ChattersPage } from './pages/ChattersPage';
import { CreatorsPage } from './pages/CreatorsPage';
import { DashboardPage } from './pages/DashboardPage';
import { EarningsPage } from './pages/EarningsPage';
import { LoginPage } from './pages/LoginPage';
import { MarketingPage } from './pages/MarketingPage';
import { useAuth } from './providers/AuthProvider';
import { type AppRoutePath, useRouter } from './providers/RouterProvider';
import type { DateRangeFilter } from './types/api.types';

const TAB_TO_PATH: Record<NavTabId, AppRoutePath> = {
  overview: '/dashboard',
  creators: '/creators',
  chatters: '/chatters',
  earnings: '/earnings',
  marketing: '/marketing',
};

function resolveTabFromPath(pathname: string): NavTabId {
  switch (pathname) {
    case '/creators':
      return 'creators';
    case '/chatters':
      return 'chatters';
    case '/earnings':
      return 'earnings';
    case '/marketing':
    case '/tracking-links':
      return 'marketing';
    case '/dashboard':
    default:
      return 'overview';
  }
}

export function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const { pathname, navigate } = useRouter();
  const queryClient = useQueryClient();

  const [dateRange, setDateRange] = useState<DateRangeFilter>(() =>
    getPresetDateRange(30),
  );

  // Synchronize URL pathname with authentication state and canonical routes
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      if (pathname !== '/login') {
        navigate('/login', { replace: true });
      }
      return;
    }

    // When authenticated, redirect '/' or '/login' or unknown paths to '/dashboard'
    const validProtectedPaths = [
      '/dashboard',
      '/creators',
      '/chatters',
      '/earnings',
      '/marketing',
      '/tracking-links',
    ];
    if (!validProtectedPaths.includes(pathname)) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, pathname, navigate]);

  // Keep document title updated with current route
  useEffect(() => {
    const titles: Record<string, string> = {
      '/login': 'Sign In — Muse Agency Dashboard',
      '/dashboard': 'Dashboard Overview — Muse Agency',
      '/creators': 'Creators Management — Muse Agency',
      '/chatters': 'Chatter Performance — Muse Agency',
      '/earnings': 'Earnings & Revenue — Muse Agency',
      '/marketing': 'Marketing Analytics — Muse Agency',
      '/tracking-links': 'Marketing Analytics — Muse Agency',
    };
    document.title = titles[pathname] || 'Muse Agency Management Dashboard';
  }, [pathname]);

  const handleRefresh = () => {
    setDateRange((prev) => ({
      ...prev,
      refresh: true,
    }));
    void queryClient.invalidateQueries();
  };

  const handleNavigateTab = (tab: NavTabId) => {
    navigate(TAB_TO_PATH[tab]);
  };

  if (isLoading) {
    return (
      <Stack
        direction="vertical"
        align="center"
        justify="center"
        minHeight="100vh"
        gap={3}
      >
        <Spinner size="lg" label="Verifying JWT session..." />
      </Stack>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const activeTab = resolveTabFromPath(pathname);

  return (
    <DashboardLayout
      activeTab={activeTab}
      dateRange={dateRange}
      onDateRangeChange={(next) =>
        setDateRange({
          startDate: next.startDate,
          endDate: next.endDate,
          refresh: false,
        })
      }
      onRefresh={handleRefresh}
    >
      {activeTab === 'overview' && (
        <DashboardPage
          dateRange={dateRange}
          onNavigateTab={handleNavigateTab}
        />
      )}
      {activeTab === 'creators' && <CreatorsPage dateRange={dateRange} />}
      {activeTab === 'chatters' && <ChattersPage dateRange={dateRange} />}
      {activeTab === 'earnings' && <EarningsPage dateRange={dateRange} />}
      {activeTab === 'marketing' && <MarketingPage dateRange={dateRange} />}
    </DashboardLayout>
  );
}

export default App;
