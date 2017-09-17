import React from "react";
import classNames from "classnames";
import PropTypes from "prop-types"
import { connect } from "react-redux"
import StopLink from "./StopLink"
import Panel from "./Panel"
import {selectRoute} from "../redux/actions"
import {Link} from "react-router-dom";
import {createSelector} from "reselect";

const secondsToMinutes = s => Math.floor(s / 60);

const getTransitData = state => state.transitData;
const getSelectedRoute = state => state.selection.value.route;
const getSelectedShape = state => state.selection.value.shape;

export const getSelectedRouteInfo = createSelector(
  [getTransitData, getSelectedRoute, getSelectedShape],
  (transitData, route, shape) => {
    let tripsByShape = Object.values(transitData.getRouteTripsByShape(route));

    return {
      route,
      shape: shape == null ? transitData.getShapeById(route.shapes[0]) : shape,
      trips: tripsByShape.map(trips => trips[0]),
      transitData
    };
  });

export class RouteView extends React.Component {
  constructor() {
    super();
    this.state = {index: 0};
  }
  render() {
    const route = this.props.route;
    const trips = this.props.trips;


    let selectedTrip = trips[this.state.index];

    return <Panel type={route.getType()}>
      <div className={classNames("route-title", `route-title-${route.getType()}`)}>{route.id}</div>
      {trips.map((t,i) =>
                          <Direction name={this.props.transitData.getStopById(t.lastStop).name}
                                     route={route}
                                     shapeId={t.shape}
                                     isSelected={t.shape === this.props.shape.id}
                                     key={i} />)}
      <div className="scr">
        <TripStops key={selectedTrip.id} trip={selectedTrip} stopTimes={selectedTrip.stopTimes} transitData={this.props.transitData} />
      </div>
    </Panel>;
  }
}

RouteView.propTypes = {
  route: PropTypes.object
};


let Direction = ({route, shapeId, name, isSelected}) => {
  return <Link to={`/route/${route.id}/shape/${shapeId}`} style={{"display": "block", "fontWeight": isSelected ? "bold" : ""}}>{name}</Link>
};

let TripStops = ({stopTimes, transitData}) => {
  return <table className="trip-stops">
    <thead>
      <tr>
        <th>TIME</th>
        <th>STOP</th>
      </tr>
    </thead>
    <tbody>
    {stopTimes.map(st => <tr key={st.stopSequence}>
      <td>{secondsToMinutes(st.arrivalTime - stopTimes[0].arrivalTime) + ""}</td>
      <td><StopLink stop={transitData.getStopById(st.stop)} /></td>
    </tr>)}
    </tbody>
  </table>
}

const mapStateToProps = (s) => {
  return getSelectedRouteInfo(s);
};

const mapDispatchToProps = dispatch => ({
  selectRoute: (route, shape) => dispatch(selectRoute(route, shape))
});

export const SelectedRouteView = connect(mapStateToProps, mapDispatchToProps)(RouteView);
