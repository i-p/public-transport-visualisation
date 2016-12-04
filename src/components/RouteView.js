import React from "react";
import { connect } from "react-redux"
import _ from "lodash"
import StopLink from "./StopLink"
import Panel from "./Panel"
import {selectRoute} from "../redux/actions"

const secondsToMinutes = s => Math.floor(s / 60);


export class RouteView extends React.Component {
  constructor() {
    super();
    this.state = {index: 0};
  }
  selectDirection(index, shape) {
    this.setState({ index });
    this.props.selectRoute(shape.route, shape);
  }
  render() {
    const route = this.props.route;

    let tripsByShape = Object.values(_.groupBy(route.trips, t => t.shape.id));

    let selectedTrip = tripsByShape[this.state.index][0];

    return <Panel type={route.getType()}>
      <div className="route-title">{route.id}</div>
      {tripsByShape.map((t,i) =>
                          <Direction name={t[0].lastStop.name}
                                     isSelected={i === this.state.index}
                                     onClick={() => this.selectDirection(i, t[0].shape)} />)}
      <div className="scr">
        <TripStops key={selectedTrip.id} trip={selectedTrip} stopTimes={selectedTrip.stopTimes}/>
      </div>
    </Panel>;
  }
}


let Direction = ({onClick, name, isSelected}) => {
  return <a style={{"display": "block", "font-weight": isSelected ? "bold" : ""}} onClick={onClick}>{name}</a>
};


//TODO fix key - sequence should be better
let TripStops = ({trip, stopTimes}) => {
  return <table className="trip-stops">
    <tbody>
    {stopTimes.map(st => <tr key={st.arrivalTime}>
      <td>{secondsToMinutes(st.arrivalTime - stopTimes[0].arrivalTime) + ""}</td>
      <td><StopLink stop={st.stop} /></td>
    </tr>)}
    </tbody>
  </table>
}

const mapStateToProps = s => ({ route:s.selection.value.route, shape: s.selection.value.shape });
const mapDispatchToProps = dispatch => ({
  selectRoute: (route, shape) => dispatch(selectRoute(route, shape))
});

export const SelectedRouteView = connect(mapStateToProps, mapDispatchToProps)(RouteView);
