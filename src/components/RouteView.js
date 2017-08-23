import React from "react";
import { connect } from "react-redux"
import _ from "lodash"
import StopLink from "./StopLink"
import Panel from "./Panel"
import {selectRoute} from "../redux/actions"
import {Link} from "react-router-dom";

const secondsToMinutes = s => Math.floor(s / 60);


export class RouteView extends React.Component {
  constructor() {
    super();
    this.state = {index: 0};
  }
  render() {
    const route = this.props.route;

    let tripsByShape = Object.values(this.props.transitData.getRouteTripsByShape(route));

    //TODO FIX
    let selectedTrip = tripsByShape[0 /* this.state.index*/][0];

    return <Panel type={route.getType()}>
      <div className="route-title">{route.id}</div>
      {tripsByShape.map((t,i) =>
                          <Direction name={this.props.transitData.getStopById(t[0].lastStop).name}
                                     route={route}
                                     shapeId={t[0].shape}
                                     isSelected={t[0].shape === this.props.shape}
                                     key={i} />)}
      <div className="scr">
        <TripStops key={selectedTrip.id} trip={selectedTrip} stopTimes={selectedTrip.stopTimes} transitData={this.props.transitData} />
      </div>
    </Panel>;
  }
}


let Direction = ({route, shapeId, name, isSelected}) => {
  return <Link to={`/route/${route.id}/shape/${shapeId}`} style={{"display": "block", "fontWeight": isSelected ? "bold" : ""}}>{name}</Link>
};


//TODO fix key - sequence should be better
let TripStops = ({trip, stopTimes, transitData}) => {
  return <table className="trip-stops">
    <tbody>
    {stopTimes.map(st => <tr key={st.stopSequence}>
      <td>{secondsToMinutes(st.arrivalTime - stopTimes[0].arrivalTime) + ""}</td>
      <td><StopLink stop={transitData.getStopById(st.stop)} /></td>
    </tr>)}
    </tbody>
  </table>
}

const mapStateToProps = (s) => {
  const route = s.selection.value.route;
  const shape = s.selection.value.shape;

  return { route, shape, transitData: s.transitData };
};

const mapDispatchToProps = dispatch => ({
  selectRoute: (route, shape) => dispatch(selectRoute(route, shape))
});

export const SelectedRouteView = connect(mapStateToProps, mapDispatchToProps)(RouteView);
