import React from "react";
import classNames from "classnames";
import { connect } from "react-redux";
import { selectRouteStop } from "../redux/actions"
import {Link} from "react-router-dom";

const classForType = {
  bus: "route-link-bus",
  tram: "route-link-tram",
  trolleybus: "route-link-trolleybus"
};

//TODO merge with RouteLink
const RouteStopLink = connect()(({route, stop, isActive, children, dispatch}) =>
  <Link to={`/stop/${stop.id}/route/${route.id}`}
     className={classNames("route-stop-link",classForType[route.getType()],{"route-link-active": isActive })}
     >{children}</Link>);

export default RouteStopLink
