import { createRoute } from '@tanstack/react-router'
import { rootRoute } from '@/router/rootRoute'

import WorkersList from './pages/WorkersList'
import WorkerDetail from './pages/WorkerDetail'
import WorkerAttendance from './pages/WorkerAttendance'

const workersRoute = createRoute({ getParentRoute: () => rootRoute, path: '/workers', component: WorkersList })
const workerDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/workers/$workerId', component: WorkerDetail })
const workerAttendanceRoute = createRoute({ getParentRoute: () => rootRoute, path: '/workers/attendance', component: WorkerAttendance })

export const workersRoutes = [
  workersRoute,
  workerDetailRoute,
  workerAttendanceRoute,
]
