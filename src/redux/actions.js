
export const selectRouteStop =
  (route, stop) => ({type: "SELECT_ROUTE_AND_STOP", route, stop});

export const selectRoute =
  (route, shape = route.shapes[0]) => ({ type: "SELECT_ROUTE", route, shape });

export const selectStop =
  (stop) => ({ type: "SELECT_STOP", stop });

export const selectStopTime =
  (stopTime) => ({ type: "SELECT_STOP_TIME", stopTime });

export const selectEntity =
  (entity) => ({ type: "SELECT_ENTITY", entity });

export const selectNothing =
  (entity) => ({ type: "SELECT_NOTHING", entity });

export const clockTick =
  (time) => ({ type: "CLOCK_TICK", payload: time });

