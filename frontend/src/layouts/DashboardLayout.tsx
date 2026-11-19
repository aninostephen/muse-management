import { type ReactNode, useState } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { Heading } from '@astryxdesign/core/Heading';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { useIsFetching } from '@tanstack/react-query';
import {
  BarChart3,
  DollarSign,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { useAuth } from '../providers/AuthProvider';
import {
  type AppRoutePath,
  RouterLink,
  useRouter,
} from '../providers/RouterProvider';
import { useThemeMode } from '../providers/ThemeProvider';
import type { DateRangeFilter } from '../types/api.types';

export type NavTabId =
  | 'overview'
  | 'creators'
  | 'chatters'
  | 'earnings'
  | 'marketing';

interface NavItemConfig {
  id: NavTabId;
  path: AppRoutePath;
  label: string;
  subtitle: string;
  icon: ReactNode;
}

export const DASHBOARD_NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'overview',
    path: '/dashboard',
    label: 'Overview',
    subtitle: 'Agency-wide performance KPIs, revenue trends, and top performers',
    icon: <LayoutDashboard size={18} />,
  },
  {
    id: 'creators',
    path: '/creators',
    label: 'Creators',
    subtitle:
      'Creator roster, subscription & PPV revenue, active fans, and profile analytics',
    icon: <Users size={18} />,
  },
  {
    id: 'chatters',
    path: '/chatters',
    label: 'Chatters',
    subtitle:
      'Employee performance, verified sales attribution, PPV unlock rates, and reply speed',
    icon: <MessageSquare size={18} />,
  },
  {
    id: 'earnings',
    path: '/earnings',
    label: 'Earnings',
    subtitle:
      'Detailed gross & net revenue breakdown, transaction categories, and refunds',
    icon: <DollarSign size={18} />,
  },
  {
    id: 'marketing',
    path: '/marketing',
    label: 'Marketing Analytics',
    subtitle:
      'Tracking links, free trial links, profile promotions, clicks, conversions, and attributed revenue',
    icon: <Link2 size={18} />,
  },
];

interface DashboardLayoutProps {
  activeTab: NavTabId;
  dateRange: DateRangeFilter;
  onDateRangeChange: (next: DateRangeFilter) => void;
  onRefresh: () => void;
  children: ReactNode;
}

export function DashboardLayout({
  activeTab,
  dateRange,
  onDateRangeChange,
  onRefresh,
  children,
}: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const { navigate } = useRouter();
  const { mode, toggleMode } = useThemeMode();
  const isFetchingCount = useIsFetching();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentNav =
    DASHBOARD_NAV_ITEMS.find((item) => item.id === activeTab) ||
    DASHBOARD_NAV_ITEMS[0];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="dashboard-shell">
      {/* Sidebar Navigation */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Stack direction="vertical" gap={4} padding={4}>
          {/* Brand Header */}
          <Stack direction="horizontal" justify="between" align="center">
            <RouterLink
              to="/dashboard"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Stack direction="horizontal" gap={2} align="center">
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                    color: '#ffffff',
                    flexShrink: 0,
                  }}
                >
                  <BarChart3 size={20} />
                </div>
                <Stack direction="vertical" gap={0}>
                  <Heading level={3}>Muse Agency</Heading>
                  <Text type="supporting">Infloww BI Suite</Text>
                </Stack>
              </Stack>
            </RouterLink>

            <div className="mobile-menu-btn">
              <Button
                label="Close sidebar"
                isIconOnly
                variant="ghost"
                size="sm"
                icon={<X size={18} />}
                onClick={() => setSidebarOpen(false)}
              />
            </div>
          </Stack>

          <Divider />

          {/* Navigation Menu with real route URLs (/dashboard, /creators, /chatters, /earnings, /marketing) */}
          <nav aria-label="Main navigation">
            <Stack direction="vertical" gap={1}>
              {DASHBOARD_NAV_ITEMS.map((item) => {
                const isActive = item.id === activeTab;
                return (
                  <RouterLink
                    key={item.id}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      textDecoration: 'none',
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 500,
                      backgroundColor: isActive
                        ? 'var(--dashboard-accent)'
                        : 'transparent',
                      color: isActive ? '#ffffff' : 'inherit',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </RouterLink>
                );
              })}
            </Stack>
          </nav>
        </Stack>

        {/* Sidebar Footer: Security & User Profile */}
        <Stack direction="vertical" gap={3} padding={4}>
          <Stack direction="vertical" gap={1}>
            <Badge
              variant="success"
              label="Read-Only Infloww v1.4"
              icon={<ShieldCheck size={12} />}
            />
            <Text type="supporting">
              Write operations are blocked at the client & server boundaries.
            </Text>
          </Stack>

          <Divider />

          <Stack direction="horizontal" justify="between" align="center">
            <Stack direction="vertical" gap={0}>
              <Text weight="semibold" maxLines={1}>
                {user?.name || 'Agency Admin'}
              </Text>
              <Text type="supporting" maxLines={1}>
                {user?.email || 'admin@musemanagement.com'}
              </Text>
            </Stack>
            <Button
              label="Sign Out"
              variant="ghost"
              size="sm"
              isIconOnly
              tooltip="Sign out of JWT session"
              icon={<LogOut size={16} />}
              onClick={handleLogout}
            />
          </Stack>
        </Stack>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main">
        {/* Top Navigation Bar */}
        <header className="dashboard-topbar">
          <Stack
            direction="horizontal"
            justify="between"
            align="center"
            wrap="wrap"
            gap={3}
          >
            <Stack direction="horizontal" gap={2} align="center">
              <div className="mobile-menu-btn">
                <Button
                  label="Open menu"
                  isIconOnly
                  variant="secondary"
                  size="sm"
                  icon={<Menu size={18} />}
                  onClick={() => setSidebarOpen(true)}
                />
              </div>
              <Stack direction="vertical" gap={0}>
                <Heading level={2}>{currentNav.label}</Heading>
                <Text type="supporting">{currentNav.subtitle}</Text>
              </Stack>
            </Stack>

            <Stack
              direction="horizontal"
              gap={2}
              align="center"
              wrap="wrap"
            >
              <DateRangePicker
                value={dateRange}
                onChange={onDateRangeChange}
                isLoading={isFetchingCount > 0}
              />

              <Button
                label={isFetchingCount > 0 ? 'Syncing...' : 'Refresh Data'}
                variant="secondary"
                size="sm"
                isLoading={isFetchingCount > 0}
                icon={<RefreshCw size={14} />}
                onClick={onRefresh}
                tooltip="Sync latest data from Infloww API"
              />

              <Button
                label={mode === 'dark' ? 'Light' : 'Dark'}
                variant="ghost"
                size="sm"
                isIconOnly
                tooltip={`Switch to ${mode === 'dark' ? 'light' : 'dark'} theme`}
                icon={mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                onClick={toggleMode}
              />
            </Stack>
          </Stack>
        </header>

        {isFetchingCount > 0 && (
          <div className="fetching-progress-track">
            <div className="fetching-progress-bar" />
          </div>
        )}

        {/* Page Body */}
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
