import React from "react";
import classNames from "classnames";
import { connect } from "react-redux";
import { selectRoute } from "../redux/actions"
import {Link} from "react-router-dom";

const classForType = {
  bus: "route-link-bus",
  tram: "route-link-tram",
  trolleybus: "route-link-trolleybus"
};

function getClasses(route) {
  return classNames("route-link", classForType[route.getType()]);
}
const mapDispatchToProps = dispatch => ({
  selectRoute: route => dispatch(selectRoute(route)),
  highlight: object => dispatch({ type: "HIGHLIGHT", object })
});

const RouteLink = connect(null, mapDispatchToProps)(({route, children, useStyle="true", triggerHighlight=false, selectRoute, highlight}) =>
  <Link to={`/route/${route.id}`} className={useStyle == "true" ? getClasses(route) : ""}
     onMouseEnter={() => triggerHighlight && highlight(route)}
     onMouseLeave={() => triggerHighlight && highlight(null)}
     >{children || route.id}</Link>);




export default RouteLink


