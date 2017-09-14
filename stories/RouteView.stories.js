import React from 'react';
import {storiesOf, action} from '@kadira/storybook';
import {initialState, transitData, wrapInProviderAndRouter} from "./testUtils";
import configureStore from "../src/redux/configureStore";
import {selectRoute, setTransitData} from "../src/redux/actions";
import {getSelectedRouteInfo, SelectedRouteView} from "../src/components/RouteView";

function makeRouteView(routeId) {
  const store = configureStore(initialState);

  store.dispatch(setTransitData(transitData));
  store.dispatch(selectRoute(routeId));

  return wrapInProviderAndRouter(<SelectedRouteView {...getSelectedRouteInfo(store.getState())} />, store);
}

storiesOf("Route view", module)
  .add("bus", () => makeRouteView('93'))
  .add("tram", () => makeRouteView('1'))
  .add("trolleybus", () => makeRouteView('212'));
