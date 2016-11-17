import { combineReducers } from "redux";
import timeReducer from "./timeReducer"
import selectionReducer from "./selectionReducer"

const rootReducer = combineReducers({
  selection: selectionReducer,
  transitData: (s = null, action) => {
    switch (action.type) {
      case "SET_TRANSIT_DATA":
        return action.data;
      default:
        return s;
    }
  },
  time: timeReducer,
  speed: (s = null, action) => {
    switch (action.type) {
      case "SET_SPEED":
        return action.speed;
      default:
        return s;
    }
  }
});

export default rootReducer;
