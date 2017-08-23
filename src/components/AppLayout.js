require('normalize.css/normalize.css');
require('styles/App.scss');

import React from "react"
import {Switch} from "react-router-dom";
import {connect} from "react-redux";
import {selectNothing, selectRoute, selectRouteStop, selectStop, selectTrip} from "../redux/actions";
import BottomPanel from "./BottomPanel"
import AppContainer from "./Main"
import InfoPanel from "./InfoPanel"
import { Router, Route, browserHistory } from 'react-router';

class AppLayout extends React.Component {
  constructor() {
    super()
  }

  componentDidMount() {
  }

  render() {
    return <div>
      <div className="viewer">
        <div id="cesiumContainer"></div>
        <BottomPanel/>
        <div id="credits"></div>
      </div>
      <aside id="panel">
        <InfoPanel/>
        <AppContainer/>
      </aside>
      <Switch>
          <Route exact path="/"
                 component={onMount(({dispatch}) => dispatch(selectNothing()))} />
          <Route path="/stop/:stopId/route/:routeId"
                 component={onMount(({dispatch, match}) => dispatch(selectRouteStop(match.params.routeId, match.params.stopId)))} />
          <Route path="/route/:routeId/shape/:shapeId"
                 component={onMount(({dispatch, match}) => dispatch(selectRoute(match.params.routeId, match.params.shapeId)))} />
          <Route path="/route/:routeId"
             component={onMount(({dispatch, match}) => dispatch(selectRoute(match.params.routeId, null)))} />
          <Route path="/stop/:stopId"
                 component={onMount(({dispatch, match}) => dispatch(selectStop(match.params.stopId)))} />
          <Route path="/trip/:tripId"
                 component={onMount(({dispatch, match}) => dispatch(selectTrip(match.params.tripId)))} />
      </Switch>
    </div>;
  }
}

const onMount = (callback) => connect()(class extends React.Component {
  componentDidMount() { callback(this.props); }
  render() { return null; }
});


export default AppLayout
