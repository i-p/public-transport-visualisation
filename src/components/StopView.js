import React from "react"
import { connect } from "react-redux"
import * as utils from "../utils"
import RouteStopLink from "./RouteStopLink"
import StopTimeLink from "./StopTimeLink"
import _ from "lodash"
import Panel from "./Panel"

export const StopView = ({stop, time, transitData }) => {
  let stopTimes = [];
  let selectedStop = stop;
  let stopTimesByRoute = new Map();
  let secondsOfDay = utils.toSecondsOfDay(time);

  //TODO move to transit data
  for (let t of transitData.trips.values()) {
    const route = transitData.routes.get(t.route);

    for (let st of t.stopTimes) {
      if (st.stop === selectedStop.id) {

        if (!stopTimesByRoute.has(route.id)) {
          stopTimesByRoute.set(route.id, []);
        }

        stopTimesByRoute.get(route.id).push(st);

        if (st.arrivalTime >= secondsOfDay) {
          stopTimes.push([st, route]);
        }
      }
    }
  }

  let nextStopTimes = _.take(stopTimes, 5);

  //TODO indicate that the bus is currently at the stop
  // show < 1 min until the bus actually arrives
  return <Panel>
    <h1 className="stop-name">{stop.name}</h1>
    <div className="route-list">{Array.from(Array.from(stopTimesByRoute.keys()).map(id => transitData.getRouteById(id)), r =>
      <RouteStopLink key={r.id} stop={stop} route={r}>
        <div className="route-list-item">{r.id}</div>
      </RouteStopLink>
    )}</div>
    <table className="t" style={{width:"100%"}}>
      <tbody>
      {nextStopTimes.map(([st, r]) => <NextStopTime key={st.arrivalTime} route={r} st={st} secondsOfDay={secondsOfDay} transitData={transitData}/>)}
      </tbody>
    </table>
  </Panel>
};

const NextStopTime = ({st, route, secondsOfDay, transitData}) => {
  const trip = transitData.trips.get(st.trip);
  return <tr>
    <td><RouteStopLink route={route} stop={st.stop}>{route.id}</RouteStopLink></td>
    <td>{trip.lastStop.name}</td>
    <td style={{"text-align": "right", padding: "5px"}}>{Math.ceil((st.arrivalTime - secondsOfDay) / 60) + " min"}</td>
    <td style={{"text-align": "right"}}><StopTimeLink stopTime={st}/></td>
  </tr>;
};

const mapStateToProps = (state) => {
  return {
    stop: state.selection.value,
    transitData: state.transitData,
    time: state.time
  };
};

export const SelectedStopView = connect(mapStateToProps)(StopView);
