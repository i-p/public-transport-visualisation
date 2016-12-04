import React from "react";
import { connect } from "react-redux"
import { selectStopTime} from "../redux/actions"
import { formatSecondsOfDay } from "../utils"

const StopTimeLink = connect()(({stopTime, children, dispatch}) => {

  const content = children || formatSecondsOfDay(stopTime.arrivalTime);

  return <a href="#" onClick={() => dispatch(selectStopTime(stopTime))}>
    {content}
  </a>;
});

export default StopTimeLink;
