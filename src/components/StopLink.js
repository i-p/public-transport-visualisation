import React from "react";
import { connect } from "react-redux";
import { selectStop } from "../redux/actions"
import {Link} from "react-router-dom";

export const StopLink = ({stop, children, dispatch}) =>
  <Link to={`/stop/${stop.id}`}
     onMouseEnter={() => dispatch({type:"HIGHLIGHT", object: stop})}
     onMouseLeave={() => dispatch({type:"HIGHLIGHT", object: null})}>
    {children || stop.name}
  </Link>;

export default connect()(StopLink);
