import React from 'react';
import { storiesOf, action } from '@kadira/storybook';

import '../src/styles/App.scss'

import {StopLink} from "../src/components/StopLink";
import {Provider} from "react-redux";
import {BrowserRouter, MemoryRouter} from "react-router-dom";
import {Stop} from "../src/models/Stop";
import configureStore from "../src/redux/configureStore";
import {specs, describe, it } from "storybook-addon-specifications";
import expect from "jest-matchers";
import jestMock from "jest-mock";
import {mount} from "enzyme";

import Cesium from "cesium";

const store = configureStore();

import loadCityData from "../src/cities/Bratislava";
import {RouteView} from "../src/components/RouteView";
import {StopView} from "../src/components/StopView";
import {RouteStopView} from "../src/components/RouteStopView";
import {TripView} from "../src/components/TripView";
import {BottomPanelComponent} from "../src/components/BottomPanel";


const data = require("../src/data.json");
const routeTimetables = require("../src/timetables.json");

const [transitData] = loadCityData(data, routeTimetables);

const logAction = reduxAction => action("dispatch")(JSON.stringify(reduxAction, null, 2));

storiesOf('Stop link', module)
  .add('default', () => {

    const story = (dispatch =>
      <Provider store={store}>
        <MemoryRouter>
          <StopLink stop={new Stop({stop_id: 1, pos: null, stop_name: "STOP NAME", osmNode: null})}
                    dispatch={dispatch}>STOP NAME</StopLink>
        </MemoryRouter>
      </Provider>
    );

    specs(() => describe("default", () => {
      it('should redirect to a stop specific URL', () => {
        let dispatch = () => {};
        let component = mount(story(dispatch));

        // simulate("click") doesn't work
        // https://github.com/ReactTraining/react-router/issues/4337#issuecomment-297730901
        component.find('a').props().onClick(new MouseEvent('click'));

        expect(component.find(MemoryRouter).node.history.location.pathname).toBe('/stop/1');
      });
      it('should dispatch HIGHLIGH action on mouseenter', () => {
        let dispatch = jestMock.fn();
        let component = mount(story(dispatch));

        component.find('a').simulate('mouseenter');

        //TODO verify object property
        expect(dispatch.mock.calls.length).toBe(1);
        expect(dispatch.mock.calls[0][0]).toBe({ type: "HIGHLIGHT" });
      })
    }));

    return story(logAction);
  });

storiesOf("Route view", module)
  .add("bus", () => {
    return <Provider store={store}>
      <MemoryRouter>
        <RouteView route={transitData.getRouteById('93')} transitData={transitData} />
      </MemoryRouter>
    </Provider>
  })
  .add("tram", () => {
    return <Provider store={store}>
      <MemoryRouter>
        <RouteView route={transitData.getRouteById('1')} transitData={transitData}/>
      </MemoryRouter>
    </Provider>
  })
  .add("trolleybus", () => {
    return <Provider store={store}>
      <MemoryRouter>
        <RouteView route={transitData.getRouteById('212')} transitData={transitData}/>
      </MemoryRouter>
    </Provider>
  });



const time = Cesium.JulianDate.fromDate(new Date(2017, 4, 24, 13, 11));

storiesOf("Stop view", module)
  .add("default", () => {
    return <Provider store={store}>
      <MemoryRouter>
        <StopView stop={transitData.getStopById(1374680710)}
                  time={time}
                  transitData={transitData} />
      </MemoryRouter>
    </Provider>
  });

storiesOf("Stop route view", module)
  .add("default", () => {
    return <Provider store={store}>
      <MemoryRouter>
        <RouteStopView route={transitData.getRouteById('206')}
                       stop={transitData.getStopById(1374680710)}
                       transitData={transitData} />
      </MemoryRouter>
    </Provider>
  });

storiesOf("Trip view", module)
  .add("a", () => {
    return <Provider store={store}>
      <MemoryRouter>
        <TripView trip={transitData.getRouteTrip(transitData.getRouteById('206'), 30)}
                  time={time} transitData={transitData} />
      </MemoryRouter>
    </Provider>
  });

storiesOf("Bottom panel", module)
  .add("a", () => {
    return <Provider store={store}>
      <MemoryRouter>
        <BottomPanelComponent time={time}
                              speed={5}
                              direction={1} />
      </MemoryRouter>
    </Provider>
  });
