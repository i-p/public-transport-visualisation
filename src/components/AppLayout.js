require('normalize.css/normalize.css');
require('styles/App.scss');

import React from "react"
import {Route, Switch} from "react-router-dom";
import {connect} from "react-redux";
import {selectNothing, selectRoute, selectRouteStop, selectStop, selectTrip} from "../redux/actions";
import BottomPanel from "./BottomPanel"
import AppContainer from "./Main"
import InfoPanel from "./InfoPanel"
import classNames from "classnames"

const HelpBlock = (props) =>
  <div>
    <i className={classNames("fa", props.classes)} aria-hidden="true"/>
    <div>
      <div className="help-command">{props.command}</div>
      <div className="help-controls">{props.action}</div>
    </div>
  </div>;

class AppLayout extends React.Component {
  constructor() {
    super();
    this.state = {
      helpVisible: false
    };
  }

  componentDidMount() {
  }

  render() {
    return <div>
      <div className="viewer">
        <div id="help" className={classNames({ active: this.state.helpVisible })}>

          {<HelpBlock command="Move"
                      action="Left click + drag"
                      classes="fa-arrows"/>}

          {<HelpBlock command="Zoom"
                      action="Mouse wheel scroll / right click + drag"
                      classes="fa-search-plus"/>}

          {<HelpBlock command="Select a stop / vehicle"
                      action="Left click"
                      classes="fa-crosshairs"/>}

          {<HelpBlock command="Change time"
                      action="Click on timeline"
                      classes="fa-clock-o"/>}


        </div>
        <div id="help-button" onClick={() => this.setState({helpVisible: !this.state.helpVisible}) }>
          <i className="fa fa-question"/>
        </div>
        <div id="cesiumContainer"/>
        <BottomPanel/>
        <div id="credits"/>
        <div id="loading-overlay">
          Loading...
        </div>
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
