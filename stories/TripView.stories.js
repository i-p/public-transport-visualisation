import React from 'react';
import {storiesOf} from '@kadira/storybook';
import {specs, describe, it } from "storybook-addon-specifications";
import expect from "jest-matchers";
import {
  clickOn, mkStory, mountStory, time, transitData, urlPathOf} from "./testUtils";
import {TripView} from "../src/components/TripView";
import {StopLink} from "../src/components/StopLink";
import StopTimeLink from "../src/components/StopTimeLink";

storiesOf("Trip view", module)
  .add("in service", () => {
    const story = () =>
      <TripView trip={transitData.getRouteTrip(transitData.getRouteById('61'), 36)}
                time={time}
                transitData={transitData} />;

    specs(() => describe("in service", () => {
      it("shows stop view after clicking on a stop's name", () => {
        let [component] = mountStory(story);

        clickOn(component.find(StopLink).first().find("a"));

        expect(urlPathOf(component)).toBe(`/stop/403833629`);
      });

      it("changes time after clicking on an arrival time", () => {
        let [component, middlewareMock] = mountStory(story);

        clickOn(component.find(StopTimeLink).first().find("a"));

        expect(middlewareMock).toHaveBeenCalledWith(
          expect.objectContaining({ type: "SELECT_STOP_TIME" }));
      });

    }));

    return mkStory(story)[0];
  });
