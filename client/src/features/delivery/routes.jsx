import { createRoute } from "@tanstack/react-router";
import { appLayoutRoute } from "@/router/appLayoutRoute";

import DeliveryOverview from "./pages/DeliveryOverview";
import DeliveryStatus from "./pages/DeliveryStatus";
import DriversList from "./pages/DriversList";
import DriverDetail from "./pages/DriverDetail";

const deliveryRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/delivery",
  component: DeliveryOverview,
});
const driversRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/delivery/drivers",
  component: DriversList,
});
const deliveryStatusRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/delivery/status",
  component: DeliveryStatus,
});
const driverDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/delivery/drivers/$driverId",
  component: DriverDetail,
});

export const deliveryRoutes = [
  deliveryRoute,
  deliveryStatusRoute,
  driversRoute,
  driverDetailRoute,
];
