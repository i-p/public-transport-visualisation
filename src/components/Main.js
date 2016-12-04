require("normalize.css/normalize.css");

import React from "react";
import { connect } from "react-redux"
import { SelectedRouteView } from "./RouteView";
import { SelectedStopView } from "./StopView";
import { SelectedTripView } from "./TripView";
import { SelectedRouteStopView } from "./RouteStopView";
import { AllRoutesOverview } from "./RoutesOverview";

const AppComponent = ({selection}) => {
  switch (selection.type) {
    case "SELECTION_ROUTE":
      return <SelectedRouteView/>;
    case "SELECTION_STOP":
      return <SelectedStopView/>;
    case "SELECTION_VEHICLE":
      return <SelectedTripView/>;
    case "SELECTION_STOP_AND_ROUTE":
      return <SelectedRouteStopView/>;
    default:
      return <AllRoutesOverview/>;
  }
};

AppComponent.defaultProps = {
};

export default connect(s => ({selection: s.selection}))(AppComponent);


