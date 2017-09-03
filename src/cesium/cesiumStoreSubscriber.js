import * as Selection from "../models/selectionTypes"
import updateCesiumSelection, {displayFirstAndLastStop, displayShape} from "./updateCesiumSelection"
import {Route} from "../models/Route";
import {Stop} from "../models/Stop";

let currentSelection = { type: Selection.SELECTION_EMPTY, value: null };
let currentHighlight = null;


function setRouteHighlight(route, highlight, transitData) {
  route.shapes.forEach((s, i) => {
    displayShape(s, transitData, highlight);

    // Labels for both directions would be overlapping,
    // so highlight stops for one direction only.
    if (i === 0) {
      displayFirstAndLastStop(s, transitData, highlight);
    }
  });
}


export function createCesiumSubscriber(store, viewer) {

  return () => {

    let previousHighlight = currentHighlight;
    currentHighlight = store.getState().selection.highlight;
    let entityMap = store.getState().transitData.entityMap;
    let transitData = store.getState().transitData;

    if (previousHighlight !== currentHighlight) {
      if (previousHighlight != null) {

        //TODO transit entity collection ???
        if (previousHighlight instanceof Route) {
          setRouteHighlight(previousHighlight, false, transitData);
        }
        if (previousHighlight instanceof Stop) {
          const entity = entityMap.get(previousHighlight);
          if (entity) {
            entity.point.pixelSize = 3;
            entity.point.outlineWidth = 2;
          }
        }
      }
      if (currentHighlight != null) {
        if (currentHighlight instanceof Route) {
          setRouteHighlight(currentHighlight, true, transitData);
        }
        if (currentHighlight instanceof Stop) {
          const entity = entityMap.get(currentHighlight);
          if (entity) {
            entity.point.outlineWidth = 8;
            entity.point.pixelSize = 12;
          }
        }
      }

      viewer.forceLabelRecalculation = true;
    }


    let previousSelection = currentSelection;
    currentSelection = store.getState().selection;

    if (!viewer.clock.currentTime.equals(store.getState().time)) {
      viewer.clock.currentTime = store.getState().time.clone();
    }

    var speed = store.getState().speed;


    if (speed.direction == 0) {
      if (viewer.clock.shouldAnimate) {
        viewer.clock.shouldAnimate = false;
      }
    } else {
      viewer.clock.shouldAnimate = true;
      viewer.clock.multiplier = speed.direction * speed.speed;
    }

    if (previousSelection.type === currentSelection.type
      && previousSelection.value === currentSelection.value)
      return;

    updateCesiumSelection(previousSelection, currentSelection, viewer);



  }
}



