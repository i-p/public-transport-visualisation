import { combineReducers } from "redux";
import timeReducer from "./timeReducer"
import selectionReducer from "./selectionReducer"

const defaultSpeed = { direction: 1, speed: 10 };

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

  //TODO rename
  speed: (s = defaultSpeed, action) => {
    switch (action.type) {
      case "SET_SPEED":
        return { direction: s.direction, speed: action.speed };
      case "SET_DIRECTION":
        return { direction: action.direction, speed: s.speed };
      default:
        return s;
    }
  }
});

export default rootReducer;
