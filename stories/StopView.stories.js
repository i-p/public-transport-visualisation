import React from 'react';
import {storiesOf} from '@kadira/storybook';
import {specs, describe, it } from "storybook-addon-specifications";
import expect from "jest-matchers";
import {
  clickOn, mkStory, mountStory, time, transitData, urlPathOf} from "./testUtils";
import StopTimeLink from "../src/components/StopTimeLink";
import RouteStopLink from "../src/components/RouteStopLink";
import {StopView} from "../src/components/StopView";

storiesOf("Stop view", module)
  .add("default", () => {
    const story = () => <StopView stop={transitData.getStopById(1374680710)}
                                  time={time}
                                  transitData={transitData}/>;

    specs(() => describe("default", () => {
      it("changes time after clicking on a next arrival's time", () => {
        let [component, middlewareMock] = mountStory(story);

        clickOn(component.find(StopTimeLink).first().find("a"));

        expect(middlewareMock).toHaveBeenCalledWith(
          expect.objectContaining({ type: "SELECT_STOP_TIME" }));
      });

      it("redirects to a URL specific for given route and stop after clicking on a route link", () => {
        let [component] = mountStory(story);

        let element = component.find(RouteStopLink).first().find("a");
        clickOn(element);

        expect(urlPathOf(component)).toBe(`/stop/1374680710/route/${element.text()}`);
      });
    }));
    return mkStory(story)[0];
  });
