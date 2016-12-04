import React from "react";
import classNames from "classnames";
import { connect } from "react-redux";
import { selectRouteStop } from "../redux/actions"

const classForType = {
  bus: "route-link-bus",
  tram: "route-link-tram",
  trolleybus: "route-link-trolleybus"
};

//TODO merge with RouteLink
const RouteStopLink = connect()(({route, stop, isActive, children, dispatch}) =>
  <a href="#"
     className={classNames("route-stop-link",classForType[route.getType()],{"route-link-active": isActive })}
     onClick={() => dispatch(selectRouteStop(route, stop))}>{children}</a>);

export default RouteStopLink
