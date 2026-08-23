import { createRoute } from '@tanstack/react-router'
import { appLayoutRoute } from '@/router/appLayoutRoute'

import WorkersList from './pages/WorkersList'
import WorkerDetail from './pages/WorkerDetail'
import WorkerAttendance from './pages/WorkerAttendance'

const workersRoute = createRoute({ getParentRoute: () => appLayoutRoute, path: '/workers', component: WorkersList })
const workerDetailRoute = createRoute({ getParentRoute: () => appLayoutRoute, path: '/workers/$workerId', component: WorkerDetail })
const workerAttendanceRoute = createRoute({ getParentRoute: () => appLayoutRoute, path: '/workers/attendance', component: WorkerAttendance })

export const workersRoutes = [
  workersRoute,
  workerDetailRoute,
  workerAttendanceRoute,
]
