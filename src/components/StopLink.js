import React from "react";
import { connect } from "react-redux";
import { selectStop } from "../redux/actions"

const StopLink = connect()(({stop, children, dispatch}) =>
  <a href="#"
     onClick={() => dispatch(selectStop(stop))}
     onMouseEnter={() => dispatch({type:"HIGHLIGHT", object: stop})}
     onMouseLeave={() => dispatch({type:"HIGHLIGHT", object: null})}>
    {children || stop.name}
  </a>);

export default StopLink
