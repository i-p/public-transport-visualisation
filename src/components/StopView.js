import React from "react"
import { connect } from "react-redux"
import * as utils from "../utils"
import RouteStopLink from "./RouteStopLink"
import StopTimeLink from "./StopTimeLink"
import _ from "lodash"
import Panel from "./Panel"

let StopView = ({stop, time, transitData }) => {
  let stopTimes = [];
  let selectedStop = stop;
  let stopTimesByRoute = new Map();
  let secondsOfDay = utils.toSecondsOfDay(time);

  for (let t of transitData.trips.values()) {
    for (let st of t.stopTimes) {
      if (st.stop === selectedStop) {

        if (!stopTimesByRoute.has(st.trip.route)) {
          stopTimesByRoute.set(st.trip.route, []);
        }

        stopTimesByRoute.get(st.trip.route).push(st);

        if (st.arrivalTime >= secondsOfDay) {
          stopTimes.push(st);
        }
      }
    }
  }

  let nextStopTimes = _.take(stopTimes, 5);

  //TODO indicate that the bus is currently at the stop
  // show < 1 min until the bus actually arrives
  return <Panel>
    <h1 className="stop-name">{stop.name}</h1>
    <div className="route-list">{Array.from(stopTimesByRoute.keys(), r =>
      <RouteStopLink key={r.id} stop={stop} route={r}>
        <div className="route-list-item">{r.id}</div>
      </RouteStopLink>
    )}</div>
    <table className="t" style={{width:"100%"}}>
      <tbody>
      {nextStopTimes.map(st => <NextStopTime key={st.arrivalTime} st={st} secondsOfDay={secondsOfDay}/>)}
      </tbody>
    </table>
  </Panel>
};

const NextStopTime = ({st, secondsOfDay}) =>
  <tr>
    <td><RouteStopLink route={st.trip.route} stop={stop}>{st.trip.route.id}</RouteStopLink></td>
    <td>{st.trip.lastStop.name}</td>
    <td style={{"text-align":"right", padding: "5px"}}>{Math.ceil((st.arrivalTime - secondsOfDay) / 60) + " min"}</td>
    <td style={{"text-align":"right"}}><StopTimeLink stopTime={st}/></td>
  </tr>;



export const SelectedStopView = connect(
  s => ({stop:s.selection.value, transitData: s.transitData, time: s.time })
)(StopView);
