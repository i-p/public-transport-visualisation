import React from 'react';
import {Provider} from "react-redux";
import {MemoryRouter} from "react-router-dom";
import {setTransitData} from "../src/redux/actions";
import configureStore from "../src/redux/configureStore";
import jestMock from "jest-mock";
import {mount} from "enzyme";
import options from "../src/options";
import {TransitFeed} from "../src/models/TransitFeed";
import {getSecondsOfDayToDate} from "../src/utils";
import {loadCityData2} from "../src/cities/Bratislava";


import '../src/styles/App.scss'

export const initialState = {
  time: options.start,
  speed: {
    speed: options.defaultSpeed,
    direction: 1
  },
  transitData: new TransitFeed(),
  selection: {
    type: Selection.SELECTION_EMPTY,
    value: null
  }
};

export const logReduxAction = reduxAction => action("dispatch")(JSON.stringify(reduxAction, null, 2));

export const mockMiddleware = mock => store => next => reduxAction => {
  if (reduxAction.type !== "SET_TRANSIT_DATA") {
    mock(reduxAction);
  }
};

export function wrapInProviderAndRouter(component, initialStore) {
  return <Provider store={initialStore || configureStore(initialState, [])}>
    <MemoryRouter>
      {component}
    </MemoryRouter>
  </Provider>;
}

export function clickOn(component) {
  // simulate("click") doesn't work
  // https://github.com/ReactTraining/react-router/issues/4337#issuecomment-297730901
  component.props().onClick(new MouseEvent('click'));
}

export function urlPathOf(component) {
  return component.find(MemoryRouter).node.history.location.pathname
}

export function mkStory(fn) {
  const mock = jestMock.fn();
  const store = configureStore(initialState, [mockMiddleware(mock)]);
  store.dispatch(setTransitData(transitData));

  return [wrapInProviderAndRouter(fn(), store), mock];
}

export function mountStory(fn) {
  const result = mkStory(fn);
  result[0] = mount(result[0]);
  return result;
}

const data2 = require("../src/data_processed.json");
const secondsOfDayToDate = getSecondsOfDayToDate(options.start);
export const transitData = loadCityData2(data2, secondsOfDayToDate)[0];
export const time = Cesium.JulianDate.fromDate(new Date(2017, 4, 24, 13, 11));
