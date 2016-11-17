import { toAbsTime } from "../utils"

export default (state = null, action) => {
  switch (action.type) {
    case "CLOCK_TICK":
      return action.payload;
    case "SELECT_STOP_TIME":
      //assuming that only one day is displayed
      return toAbsTime(state, action.stopTime.arrivalTime);
    default :
      return state;
  }
};
