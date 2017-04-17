
export const selectRouteStop =
  (routeId, stopId) => ({type: "SELECT_ROUTE_AND_STOP", routeId, stopId});

export const selectRoute =
  (routeId, shapeId) => ({ type: "SELECT_ROUTE", routeId, shapeId });

export const selectStop =
  (stopId) => ({ type: "SELECT_STOP", stopId });

export const selectStopTime =
  (stopTime) => ({ type: "SELECT_STOP_TIME", stopTime });

export const selectEntity =
  (entity) => ({ type: "SELECT_ENTITY", entity });

export const selectNothing =
  (entity) => ({ type: "SELECT_NOTHING", entity });

export const clockTick =
  (time) => ({ type: "CLOCK_TICK", payload: time });

