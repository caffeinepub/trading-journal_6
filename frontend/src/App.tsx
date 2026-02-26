import React from 'react';
import { createRouter, RouterProvider, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import NewTradePage from './pages/NewTradePage';
import TradeLogPage from './pages/TradeLogPage';
import AnalyticsPage from './pages/AnalyticsPage';
import RiskManagementPage from './pages/RiskManagementPage';
import SettingsPage from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

// Root layout
const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

const newTradeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/new-trade',
  component: NewTradePage,
});

const tradeLogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/trade-log',
  component: TradeLogPage,
});

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analytics',
  component: AnalyticsPage,
});

const riskRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/risk-management',
  component: RiskManagementPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  newTradeRoute,
  tradeLogRoute,
  analyticsRoute,
  riskRoute,
  settingsRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
