import React from "react";
import { connect } from "react-redux";
import * as utils from "../utils";
import classNames from "classnames";
import RouteLink from "./RouteLink";
import StopLink from "./StopLink";
import StopTimeLink from "./StopTimeLink";
import Panel from "./Panel"

export const TripView = ({trip, time, transitData}) => {
  const route = transitData.getRouteById(trip.route);
  return <Panel type={route.getType()}>
    <div className={classNames("route-title", `route-title-${route.getType()}`)}>
      <RouteLink route={route} useStyle="false"/>
    </div>
    <Timetable stopTimes={trip.stopTimes} time={time} transitData={transitData} />
  </Panel>
};

const mapStateToProps = (state) => {
  return {
    trip: state.selection.value,
    time: state.time,
    transitData: state.transitData
  };
};

export const SelectedTripView = connect(mapStateToProps)(TripView);

let Timetable = ({stopTimes, time, transitData}) => (<table>
  <thead>
    <tr>
      <th></th>
      <th>STOP</th>
      <th>ARRIVAL</th>
    </tr>
  </thead>
  <tbody>{stopTimes.map((st, i) =>
    <TimetableEntry key={i} stopTime={st} stop={transitData.getStopById(st.stop)} time={time} previous={stopTimes[i-1]} next={stopTimes[i+1]} />)}
  </tbody>
</table>)

let TimetableEntry = (props) => {
  let {stopTime, stop} = props;

  return <tr>
    <ProgressCell {...props} />
    <td>
      <div className="timetable-stop"><StopLink stop={stop}/></div>
    </td>
    <td>
      <div className="stop-time"><StopTimeLink stopTime={stopTime}/></div>
    </td>
  </tr>;
};

function relativePosition(value, from, to) {
  if (from >= to) {
    if (value < from) return 0;
    return 1;
  }
  return (value - from) / (to - from);
}

let ProgressCell = ({stopTime, time, previous, next}) => {
  let prev = previous;
  let currentTime = utils.toSecondsOfDay(time);
  let fillStart = prev ? 0 : 0.5;
  let fillEnd = 0.5;

  if (currentTime < stopTime.arrivalTime) {
    if (prev) {
      let elapsedPart = relativePosition(currentTime, prev.departureTime, stopTime.arrivalTime);

      fillEnd = elapsedPart > 0.5 ? elapsedPart - 0.5 : 0;
    }
  } else if (currentTime > stopTime.departureTime)  {
    if (next) {
      let elapsedPart = relativePosition(currentTime, stopTime.departureTime, next.arrivalTime);

      fillEnd = elapsedPart < 0.5 ? elapsedPart + 0.5 : 1;
    }
  }

  const cssBottom = (((1 - fillEnd)*100)|0) + "%";
  const cssTop = ((fillStart * 100)|0) + "%";

  const markerClass = classNames({
    "stop-marker": true,
    "stop-marker-active": currentTime >= stopTime.arrivalTime
  });

  return <td>
    <div className="line-marker" style={{ top: prev ? 0 : "50%", bottom: next ? 0 : "50%" }}></div>
    <div className="line-marker-active" style={{ bottom: cssBottom, top : cssTop }}></div>
    <div className={markerClass}></div>
  </td>;
};
