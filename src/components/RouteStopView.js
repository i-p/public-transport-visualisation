import React from "react"
import { connect } from "react-redux"
import * as utils from "../utils"
import RouteStopLink from "./RouteStopLink"
import _ from "lodash"
import Panel from "./Panel"
import StopLink from "./StopLink"

export const RouteStopView = ({route, stop, transitData}) => {
  let stopTimesByRoute = new Map();

  //TODO move to transit data
  for (let t of transitData.trips.values()) {
    const route = transitData.routes.get(t.route);

    for (let st of t.stopTimes) {
      if (st.stop === stop.id) {
        if (!stopTimesByRoute.has(route.id)) {
          stopTimesByRoute.set(route.id, []);
        }
        stopTimesByRoute.get(route.id).push(st);
      }
    }
  }

  return <Panel type={route.getType()}>
    <h1 className="stop-name"><StopLink stop={stop}>{stop.name}</StopLink></h1>
    <div className="route-list">{Array.from(Array.from(stopTimesByRoute.keys()).map(id => transitData.getRouteById(id)), r =>
      <RouteStopLink key={r.id} stop={stop} route={r} isActive={r === route}>
        <div className="route-list-item">{r.id}</div>
      </RouteStopLink>
    )}</div>
    <div className="scr">
      <RouteTimetableAtStop route={route} stopTimes={stopTimesByRoute.get(route.id)} />
    </div>
  </Panel>;
};

let RouteTimetableAtStop = ({route, stopTimes}) => {
  return <table className="route-stop-timetable">
    <tbody>{
      _.map(_.groupBy(stopTimes, st => Math.floor(st.arrivalTime / 3600)),
        (v,k) => <StopTimesAtHour key={k} hour={k} stopTimes={v}/>)
    }</tbody>
  </table>
};

const StopTimesAtHour = ({hour, stopTimes}) =>
  <tr>
    <td>{hour}</td>
    <td>{stopTimes.map((st,i) => {
      let [,m] = utils.secondsOfDayToHMS(st.arrivalTime);
      return <a key={i}>{String(_.padStart(m, 2, "0")) + " "}</a>;
    })}</td>
  </tr>;

const mapStateToProps = (state) => {
  const route = state.selection.value.route;
  const stop = state.selection.value.stop;
  return {
    route, stop, transitData: state.transitData
  };
};

export const SelectedRouteStopView = connect(mapStateToProps)(RouteStopView);

