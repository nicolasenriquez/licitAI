import { useCreateAppRouter } from '@/app/hooks/useCreateAppRouter';
import { AppPath } from 'twenty-shared/types';

jest.mock('@/app/components/AppRouterProviders', () => ({
  AppRouterProviders: () => null,
}));
jest.mock('@/app/components/LazyRoute', () => ({
  LazyRoute: ({ children }: { children: unknown }) => children,
}));
jest.mock('@/app/components/SettingsRoutes', () => ({
  SettingsRoutes: () => null,
}));
jest.mock('@/auth/components/VerifyEmailEffect', () => ({
  VerifyEmailEffect: () => null,
}));
jest.mock('@/auth/components/VerifyLoginTokenEffect', () => ({
  VerifyLoginTokenEffect: () => null,
}));
jest.mock(
  '@/object-record/record-index/components/RecordIndexSkeletonLoader',
  () => ({
    RecordIndexSkeletonLoader: () => null,
  }),
);
jest.mock('@/ui/layout/page/components/BlankLayout', () => ({
  BlankLayout: () => null,
}));
jest.mock('@/ui/layout/page/components/DefaultLayout', () => ({
  DefaultLayout: () => null,
}));
jest.mock('@/ui/layout/page/components/MainAppLayoutWithSidePanel', () => ({
  MainAppLayoutWithSidePanel: () => null,
}));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  createBrowserRouter: jest.fn((routes) => ({ routes })),
}));

type Route = {
  children?: Route[];
  element?: {
    props: {
      children?: {
        type?: {
          _payload?: {
            _result?: () => unknown;
          };
        };
      };
    };
  };
  path?: string;
};

const getRoutes = (routes: Route[]): Route[] =>
  routes.flatMap((route) => [route, ...getRoutes(route.children ?? [])]);

const getRoute = (routes: Route[], path: string) =>
  getRoutes(routes).find((route) => route.path === path);

const getRouteComponentName = (route: Route | undefined) =>
  route?.element?.props.children?.type?._payload?._result?.toString() ?? '';

describe('useCreateAppRouter Mercado Publico route composition', () => {
  it('mounts only canonical V2 and its subroutes with no legacy alias', () => {
    const router = useCreateAppRouter(false, false);
    const routes = router.routes as Route[];
    const canonicalRoute = getRoute(routes, AppPath.MercadoPublico);

    expect(
      getRoutes(routes).filter(
        (route) => route.path === AppPath.MercadoPublico,
      ),
    ).toHaveLength(1);
    expect(getRouteComponentName(canonicalRoute)).toContain(
      'MercadoPublicoV2ActivePage',
    );
    expect(getRoute(routes, AppPath.MercadoPublicoV2History)).toBeDefined();
    expect(getRoute(routes, AppPath.MercadoPublicoV2Buyers)).toBeDefined();
    expect(getRoute(routes, AppPath.MercadoPublicoV2SyncControl)).toBeDefined();
    expect(getRoute(routes, '/mercado-publico/legacy')).toBeUndefined();
  });
});
