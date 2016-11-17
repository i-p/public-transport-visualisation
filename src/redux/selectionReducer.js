const defaultState = { type: "SELECTION_EMPTY", value:null };

export default (state = defaultState, action) => {
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
    case "SELECT_STOP":
      return { type: "SELECTION_STOP", value: action.stop };
    case "SELECT_ROUTE":
      return { type: "SELECTION_ROUTE", value: { route: action.route, shape: action.shape }};
    case "SELECT_ROUTE_AND_STOP":
      return { type: "SELECTION_STOP_AND_ROUTE", value: {
        route: action.route, stop: action.stop
      }};
    case "HIGHLIGHT":
      return { type: state.type, value: state.value, highlight: action.object };
    default:
      return state;
  }
};
