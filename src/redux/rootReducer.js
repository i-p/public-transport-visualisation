import { combineReducers } from "redux";
import timeReducer from "./timeReducer"
import selectionReducer from "./selectionReducer"

const defaultSpeed = { direction: 1, speed: 10 };

const transitDataReducer = (s = null, action) => {
  switch (action.type) {
    case "SET_TRANSIT_DATA":
      return action.data;
    default:
      return s;
  }
};

const speedReducer = (s = defaultSpeed, action) => {
  switch (action.type) {
    case "SET_SPEED":
      return {direction: s.direction, speed: action.speed};
    case "SET_DIRECTION":
      return {direction: action.direction, speed: s.speed};
    default:
      return s;
  }
};

const rootReducer = (state = {selection: null, transitData: null, time: null, speed: null}, action) => {
  const transitData = transitDataReducer(state.transitData, action);

  return ({
    selection: selectionReducer(state.selection, action, transitData),
    transitData,
    time: timeReducer(state.time, action),
    //TODO rename
    speed: speedReducer(state.speed, action)
  });
};

export default rootReducer;
