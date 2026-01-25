import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import './styles.css'
import reportWebVitals from './reportWebVitals.ts'
import { AuthProvider } from './auth/auth-provider'
import { ProtectedRoute } from './auth/protected-route'
import { InitializationGuard } from './auth/InitializationGuard'
import { AppLayout } from './_shared/components/layout/AppLayout'
import QueryProviderReact from './_shared/providers/query/QueryProvider.tsx'
import DemandListPage from './modules/devolucao/pages/DemandaDevolucaoListPage.tsx'
import ChekListPage from './modules/devolucao/pages/ChekListPage.tsx'
import DemandItemsPage from './modules/devolucao/pages/DemandItemsPage.tsx'
import ValidatePage from './modules/devolucao/pages/ValidatePage.tsx'
import ItemConferencePage from './modules/devolucao/pages/ItemConferencePage.tsx'
import DemandFinishPage from './modules/devolucao/pages/DemandFinishPage.tsx'
import AnomalyRegistrationPage from './modules/devolucao/pages/AnomalyRegistrationPage.tsx'
import AddExtraItemPage from './modules/devolucao/pages/AddExtraItemPage.tsx'
import DebugPage from './modules/admin/pages/DebugPage.tsx'


const rootRoute = createRootRoute({
  component: () => (
    <ProtectedRoute>
      <InitializationGuard>
        <QueryProviderReact>
          <AppLayout />
          <TanStackRouterDevtools />
        </QueryProviderReact>
      </InitializationGuard>
    </ProtectedRoute>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <div className='bg-red-500'>Olá Mundo</div>,
})
const chekListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chek-list',
  component: ChekListPage
})

const demandsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/demands',
  component: DemandListPage,
})

const validateDemandRoute = createRoute({
  getParentRoute: () => rootRoute,  
  path: '/demands/$id',
  component:  DemandItemsPage,
})            

const validatePageRoute = createRoute({
  getParentRoute: () => rootRoute,  
  path: '/demands/$id/validate',
  component:  ValidatePage,
})

const checklistRoute = createRoute({
  getParentRoute: () => rootRoute,  
  path: '/demands/$id/checklist',
  component:  ChekListPage,
})              

const itemConferenceRoute = createRoute({
  getParentRoute: () => rootRoute,  
  path: '/demands/$id/items/$itemId/conference',
  component:  ItemConferencePage,
})

const demandFinishRoute = createRoute({
  getParentRoute: () => rootRoute,  
  path: '/demands/$id/finish',
  component:  DemandFinishPage,
})

const anomalyRegistrationRoute = createRoute({
  getParentRoute: () => rootRoute,  
  path: '/demands/$id/items/$itemId/anomaly-registration',
  component:  AnomalyRegistrationPage,
})

const addExtraItemRoute = createRoute({
  getParentRoute: () => rootRoute,  
  path: '/demands/$id/items/add-extra',
  component:  AddExtraItemPage,
})

// Debug route - only available in development
const debugRoute = import.meta.env.DEV
  ? createRoute({
      getParentRoute: () => rootRoute,
      path: '/debug',
      component: DebugPage,
    })
  : null

const routeTree = rootRoute.addChildren(
  [
    indexRoute,
    demandsRoute,
    chekListRoute,
    validateDemandRoute,
    validatePageRoute,
    checklistRoute,
    itemConferenceRoute,
    demandFinishRoute,
    anomalyRegistrationRoute,
    addExtraItemRoute,
    ...(debugRoute ? [debugRoute] : []),
  ] as const
)

const router = createRouter({
  routeTree,
  context: {},
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})



declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </StrictMode>
  )
}

reportWebVitals()
