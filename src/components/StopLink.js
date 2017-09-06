import React from "react";
import { connect } from "react-redux";
import {highlight, selectStop} from "../redux/actions"
import {Link} from "react-router-dom";

export const StopLink = ({stop, children, dispatch}) =>
  <Link to={`/stop/${stop.id}`}
     onMouseEnter={() => dispatch(highlight(stop))}
     onMouseLeave={() => dispatch(highlight(null))}>
    {children || stop.name}
  </Link>;

export default connect()(StopLink);
