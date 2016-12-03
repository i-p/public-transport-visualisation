import React from "react";
import classNames from "classnames";
import { connect } from "react-redux";
import { selectRoute } from "../redux/actions"

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
  <a className={useStyle == "true" ? getClasses(route) : ""}
     href="#"
     onMouseEnter={() => triggerHighlight && highlight(route)}
     onMouseLeave={() => triggerHighlight && highlight(null)}
     onClick={() => selectRoute(route)}>{children || route.id}</a>);




export default RouteLink


