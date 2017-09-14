export const SELECT_ROUTE_AND_STOP = "SELECT_ROUTE_AND_STOP";
export const SELECT_ROUTE = "SELECT_ROUTE";
export const SELECT_STOP = "SELECT_STOP";
export const SELECT_TRIP = "SELECT_TRIP";
export const SELECT_STOP_TIME = "SELECT_STOP_TIME";
export const SELECT_NOTHING = "SELECT_NOTHING";
export const CLOCK_TICK = "CLOCK_TICK";
export const SET_TRANSIT_DATA = "SET_TRANSIT_DATA";
export const SEARCH = "SEARCH";
export const SET_SPEED = "SET_SPEED";
export const SET_DIRECTION = "SET_DIRECTION";
export const HIGHLIGHT = "HIGHLIGHT";

export const selectRouteStop =
  (routeId, stopId) => ({type: SELECT_ROUTE_AND_STOP, routeId, stopId});

export const selectRoute =
  (routeId, shapeId) => ({ type: SELECT_ROUTE, routeId, shapeId });

export const selectStop =
  (stopId) => ({ type: SELECT_STOP, stopId });

export const selectTrip =
  (tripId) => ({ type: SELECT_TRIP, tripId });

export const selectStopTime =
  (stopTime) => ({ type: SELECT_STOP_TIME, stopTime });

export const selectNothing =
  (entity) => ({ type: SELECT_NOTHING, entity });

export const clockTick =
  (time) => ({ type: CLOCK_TICK, payload: time });

export const setTransitData =
  (transitData) => ({ type: SET_TRANSIT_DATA, data: transitData });

export const searchForStop =
  (text) => ({ type: SEARCH, text });

export const setSpeed =
  (speed) => ({ type: SET_SPEED, speed });

export const setDirection =
  (direction) => ({ type: SET_DIRECTION, direction });

export const highlight =
  (object) => ({ type: HIGHLIGHT, object });
