import Cesium from "cesium"
import * as Selection from "../models/selectionTypes"
import updateCesiumSelection from "./updateCesiumSelection"
import {Route} from "../models/Route";
import {Stop} from "../models/Stop";
import {clockTick} from "../redux/actions";
import options from "../options";
import {getVehicleTrip, isVehicleTrip} from "./createVehicle";
import {getStop, isStop} from "./createStopEntity";

//TODO this should be stored in View
let currentSelection = { type: Selection.SELECTION_EMPTY, value: null };
let currentHighlight = null;

export function createCesiumSubscriber(store, viewer, view) {

  return () => {
    let previousHighlight = currentHighlight;
    currentHighlight = store.getState().selection.highlight;

    if (previousHighlight !== currentHighlight) {
      if (previousHighlight != null) {
        if (previousHighlight instanceof Route) {
          view.highlightRoute(previousHighlight, false);
        }
        if (previousHighlight instanceof Stop) {
          view.highlightStop(previousHighlight, false);
        }
      }
      if (currentHighlight != null) {
        if (currentHighlight instanceof Route) {
          view.highlightRoute(currentHighlight, true);
        }
        if (currentHighlight instanceof Stop) {
          view.highlightStop(currentHighlight, true);
        }
      }

      viewer.forceLabelRecalculation = true;
    }


    let previousSelection = currentSelection;
    currentSelection = store.getState().selection;

    if (!viewer.clock.currentTime.equals(store.getState().time)) {
      viewer.clock.currentTime = store.getState().time.clone();
    }

    const speed = store.getState().speed;

    if (speed.direction === 0) {
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

    updateCesiumSelection(previousSelection, currentSelection, view);



  }
}

export function setupOnInputAction(viewer, store, history) {
  viewer.screenSpaceEventHandler.setInputAction((e) => {
    let picked = viewer.scene.pick(e.position);

    if (Cesium.defined(picked)) {
      const id = Cesium.defaultValue(picked.id, picked.primitive.id);

      if (id instanceof Cesium.Entity) {
        if (isStop(id)) {
          history.push("/stop/" + getStop(id).id);
          return;
        }

        if (isVehicleTrip(id)) {
          history.push("/trip/" + getVehicleTrip(id).id);
          return;
        }
      }
    }
    history.push("/");
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

export function setupOnTickAction(viewer, store) {
  viewer.clock.onTick.addEventListener(clock => {
    store.dispatch(clockTick(clock.currentTime.clone()));
  });
}

export function setupCameraAnimationOnTileLoaded(viewer, {onAnimationStart, onAnimationEnd, onTilesPreloaded}) {
  let initialCameraAnimationStarted = false;

  viewer.camera.setView(options.cameraAnimationStart);

  let totalLength = 0;

  viewer.scene.globe.tileLoadProgressEvent.addEventListener((length) => {

    if (!initialCameraAnimationStarted) {
      totalLength += length;
      onTilesPreloaded(totalLength);
    }

    if (length === 0 && !initialCameraAnimationStarted) {
      initialCameraAnimationStarted = true;

      onAnimationStart();

      viewer.camera.flyTo({
        destination: options.initialCameraView.destination,
        orientation: options.initialCameraView.orientation,
        duration: 3,
        complete: () => {
          onAnimationEnd();
        }
      });
    }
  });
}
