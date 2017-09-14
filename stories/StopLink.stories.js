import React from 'react';
import {storiesOf} from '@kadira/storybook';
import {specs, describe, it } from "storybook-addon-specifications";
import expect from "jest-matchers";
import jestMock from "jest-mock";
import {mount} from "enzyme";
import {clickOn, logReduxAction, urlPathOf, wrapInProviderAndRouter} from "./testUtils";

import {Stop} from "../src/models/Stop";
import {StopLink} from "../src/components/StopLink";

storiesOf('Stop link', module)
  .add('default', () => {
    const stop = new Stop({stop_id: 1, pos: null, stop_name: "STOP NAME", osmNodeId: 123});
    const story = ((dispatch = () => {}) =>
        wrapInProviderAndRouter(<StopLink stop={stop} dispatch={dispatch}/>)
    );

    specs(() => describe("default", () => {

      it("default text is the stop's name", () => {
        let component = mount(story());

        expect(component.find('a').text()).toEqual(stop.name);
      });

      it('redirects to a stop specific URL', () => {
        let component = mount(story());

        clickOn(component.find('a'));

        expect(urlPathOf(component)).toBe('/stop/1');
      });
      it('highlights stop on mouse hover', () => {
        let dispatch = jestMock.fn();
        let component = mount(story(dispatch));

        component.find('a').simulate('mouseenter');

        expect(dispatch).toHaveBeenCalledWith({ type: "HIGHLIGHT", object: stop });
      })
    }));

    return story(logReduxAction);
  });
