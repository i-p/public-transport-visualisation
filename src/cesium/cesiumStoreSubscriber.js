import * as Selection from "../models/selectionTypes"
import updateCesiumSelection from "./updateCesiumSelection"
import {Route} from "../models/Route";
import {Stop} from "../models/Stop";

let currentSelection = { type: Selection.SELECTION_EMPTY, value: null };
let currentHighlight = null;

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

          previousHighlight.shapes.forEach(s => {
            const entity = entityMap.get(s);
            if (entity) {
              entity.show = false;

              const aTrip = transitData.getRouteTripWithShape(s.route, s);

              entityMap.get(aTrip.firstStop).showAlways = false;
              entityMap.get(aTrip.lastStop).showAlways = false;
            }
          });
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

          currentHighlight.shapes.forEach(s => {
            const entity = entityMap.get(s);
            if (entity) {
              entity.show = true;
              const aTrip = transitData.getRouteTripWithShape(s.route, s);

              entityMap.get(aTrip.firstStop).showAlways = true;
              entityMap.get(aTrip.lastStop).showAlways = true;
            }
          });
        }
        if (currentHighlight instanceof Stop) {
          const entity = entityMap.get(currentHighlight);
          if (entity) {
            entity.point.outlineWidth = 8;
            entity.point.pixelSize = 12;
          }
        }
      }
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



