import React from 'react';
import {storiesOf} from '@kadira/storybook';
import {specs, describe, it } from "storybook-addon-specifications";
import expect from "jest-matchers";
import {
  clickOn, mkStory, mountStory, transitData, urlPathOf} from "./testUtils";
import {RouteStopView} from "../src/components/RouteStopView";
import RouteStopLink from "../src/components/RouteStopLink";

storiesOf("Stop route view", module)
  .add("default", () => {
    const story = () => <RouteStopView route={transitData.getRouteById('61')}
                                       stop={transitData.getStopById(1753092227)}
                                       transitData={transitData}/>;

    specs(() => describe("default", () => {
      it("shows different route after clicking on a different route link", () => {
        let [component] = mountStory(story);

        let element = component.find(RouteStopLink).first().find("a");
        clickOn(element);

        expect(urlPathOf(component)).toBe(`/stop/1753092227/route/${element.text()}`);
      });
    }));

    return mkStory(story)[0];
  });
