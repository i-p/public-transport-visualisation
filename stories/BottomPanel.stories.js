import React from 'react';
import { storiesOf} from '@kadira/storybook';


import {specs, describe, it } from "storybook-addon-specifications";
import expect from "jest-matchers";
import BottomPanelComponent from "../src/components/BottomPanel";
import {setDirection, setSpeed} from "../src/redux/actions";
import {clickOn, mkStory, mountStory, time} from "./testUtils";

storiesOf("Bottom panel", module)
  .add("default", () => {
    // Add top padding to make the speed selector completely visible
    const story = () =>
      <div style={{paddingTop: "100px"}}>
        <BottomPanelComponent time={time}
                              speed={5}
                              direction={1} />
      </div>;

    specs(() => describe("default", () => {
      it("pause/run simulation", () => {
        let [component, middlewareMock] = mountStory(story);

        clickOn(component.find(".fa-pause").parent());

        expect(middlewareMock).toHaveBeenLastCalledWith(setDirection(0));

        clickOn(component.find(".fa-backward").parent());

        expect(middlewareMock).toHaveBeenLastCalledWith(setDirection(-1));

        clickOn(component.find(".fa-forward").parent());

        expect(middlewareMock).toHaveBeenLastCalledWith(setDirection(1));
      });

      it("change speed", () => {
        let [component, middlewareMock] = mountStory(story);

        clickOn(component.find(".speed-current"));
        clickOn(component.find(".speed-selector").children().first());

        expect(middlewareMock).toHaveBeenLastCalledWith(setSpeed(20));
      });
    }));

    return mkStory(story)[0];
  });
