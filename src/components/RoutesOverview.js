import React from "react";
import { connect } from "react-redux"
import RouteLink from "./RouteLink"
import Panel from "./Panel"
import _ from "lodash"
import {searchForStop} from "../redux/actions";

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
    return nextProps.routes.length !== this.routeCount || this.props.search !== nextProps.search;
  }
  render() {

    this.routeCount = this.props.routes.length;

    //TODO do grouping and sorting in OsmLoader (scoring function is city-specific, move it to city module)
    const routesByType = _.groupBy(this.props.routes, r => r.getType());

    _.forEach(routesByType, (routes) => {
      routes.sort((r1, r2) => {
        return routeScore(r1) - routeScore(r2);
      });
    });

    //TODO move out
    // const toSearchableString = str =>
    //   Array.from(str.toLowerCase().normalize("NFD")).filter(c => /[a-zA-Z0-9]/.test(c)).join("");
    //
    // const stopsByName = _.toPairs(_.groupBy(this.props.stops, s => toSearchableString(s.normalizedName)));
    //
    // const compareStrings = (s1, s2) => s1 < s2 ? -1 : s1 > s2 ? 1 : 0;
    //
    // stopsByName.sort((s1, s2) => compareStrings(s1[0], s2[0]));
    //
    // const searchString = toSearchableString(this.props.search);
    // const matchingStops = stopsByName.filter(s => searchString !== "" && s[0].startsWith(searchString));

    //TODO constants
    return <Panel>
      {/*<div className="search-box">*/}
        {/*<input type="text" value={this.props.search} onChange={e => this.props.searchFor(e.target.value)} placeholder="Enter a stop name"/>*/}

        {/*<ul>*/}
          {/*{matchingStops.slice(0, 10).map(s => <li><StopLink stop={s[1][0]}>{s[1][0].name} ({s[1].length})</StopLink></li>)}*/}
          {/*{matchingStops.length > 10 ? <li>5 more...</li> : null}*/}
        {/*</ul>*/}
      {/*</div>*/}

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

//TODO FIX
let mapStateToProps = (state) => ({ routes: Object.values(state.transitData.routes), search: state.search, stops: Object.values(state.transitData.stops) });
let mapDispatchToProps = (dispatch) => ({ searchFor: text => dispatch(searchForStop(text)) });

export const AllRoutesOverview = connect(mapStateToProps, mapDispatchToProps)(RoutesOverview);


