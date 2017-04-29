const defaultState = { type: "SELECTION_EMPTY", value:null };

export default (state = defaultState, action, transitData) => {
  switch (action.type) {
    case "SELECT_ENTITY":
      const entity = action.entity;

      if (entity.transit && entity.transit.trip) {
        return { type: "SELECTION_VEHICLE", value: entity.transit.trip };
      }
      if (entity.transit && entity.transit.stop) {
        return { type: "SELECTION_STOP", value: entity.transit.stop };
      }
      return state;
    case "SELECT_NOTHING":
      return { type: "SELECTION_EMPTY", value: null };
    case "SELECT_TRIP":
      return { type: "SELECTION_VEHICLE", value: transitData.getTripById(parseInt(action.tripId)) };
    case "SELECT_STOP":
      return { type: "SELECTION_STOP", value: transitData.getStopById(parseInt(action.stopId)) };
    case "SELECT_ROUTE":
      const route = transitData.getRouteById(action.routeId);
      const shape = action.shapeId == null ? route.shapes[0] : transitData.getShapeById(parseInt(action.shapeId));

      return { type: "SELECTION_ROUTE", value: { route, shape }};
    case "SELECT_ROUTE_AND_STOP":
      const route2 = transitData.getRouteById(action.routeId);
      const stop = transitData.getStopById(parseInt(action.stopId));

      return { type: "SELECTION_STOP_AND_ROUTE", value: { route: route2, stop }};
    case "HIGHLIGHT":
      return { type: state.type, value: state.value, highlight: action.object };
    default:
      return state;
  }
};
