import React from "react";
import { connect } from "react-redux"
import RouteLink from "./RouteLink"
import Panel from "./Panel"
import _ from "lodash"



function routeScore(route) {
  let id = route.id;
  let score = 0;

  if (id.startsWith("X")) {
    score += 1000;
    id = id.slice(1);
  } else if (id.startsWith("N")) {
    score += 2000;
    id = id.slice(1);
  }

  let parsed = Number.parseInt(id);
  return score + (Number.isNaN(parsed) ? 0 : parsed);
}

export class RoutesOverview extends React.Component {
  constructor() {
    super();
    this.routeCount = 0;
  }
  shouldComponentUpdate(nextProps) {
    return nextProps.routes.length !== this.routeCount;
  }
  render() {

    this.routeCount = this.props.routes.length;

    //TODO do grouping and sorting in OsmLoader (scoring function is city-specific, move it to city module)
    const routesByType = _.groupBy(this.props.routes, r => r.getType());

    _.forEach(routesByType, (routes, type) => {
      routes.sort((r1, r2) => {
        return routeScore(r1) - routeScore(r2);
      });
    });

    //TODO constants
    return <Panel>
      <div className="heading heading-tram">Tram routes</div>
      <div className="route-list">
        {(routesByType["tram"] || []).map(r => <RouteLink key={r.id} route={r} triggerHighlight="true" />)}
      </div>
      <div className="heading heading-trolleybus">Trolleybus routes</div>
      <div className="route-list">
        {(routesByType["trolleybus"] || []).map(r => <RouteLink key={r.id} route={r} triggerHighlight="true" />)}
      </div>
      <div className="heading heading-bus">Bus routes</div>
      <div className="route-list">
        {(routesByType["bus"] || []).map(r => <RouteLink key={r.id} route={r} triggerHighlight="true" />)}
      </div>
    </Panel>;
  }
}

let mapStateToProps = (state) => ({ routes: Array.from(state.transitData.routes.values()) });


export const AllRoutesOverview = connect(mapStateToProps, null)(RoutesOverview);


