import { Outlet, createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import Index from '@/pages/Index';
import TaskDetail from '@/pages/TaskDetail';
import Profile from '@/pages/Profile';
import NotFound from '@/pages/NotFound';

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Index,
});

export const taskRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'task/$taskId',
  component: TaskDetail,
});

export const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: Profile,
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  component: NotFound,
});

const routeTree = rootRoute.addChildren([indexRoute, taskRoute, profileRoute, notFoundRoute]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}