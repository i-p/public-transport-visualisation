import React from "react";
import classNames from "classnames";

let classByType = {
  "bus": "panel-bus",
  "tram": "panel-tram",
  "trolleybus": "panel-trolleybus"
};

const Panel = (props) => <div className={classNames("panel", classByType[props.type])}>{props.children}</div>;

export default Panel;
