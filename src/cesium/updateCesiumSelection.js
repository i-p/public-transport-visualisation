import * as Selection from "../models/selectionTypes"

let selectionActions = {
  [Selection.SELECTION_ROUTE] : {
    entry: (selection, view) => {
      let {route, shape} = selection.value;

      view.showShape(shape.id, true);
      view.showFirstAndLastStop(shape.id, true);

      view.flyTo(shape, 1.5);
    },
    exit: (selection, view) => {
      let {route, shape} = selection.value;

      view.showShape(shape.id, false);
      view.showFirstAndLastStop(shape.id, false);
    }
  },
  [Selection.SELECTION_STOP]: {
    entry: (selection, view) => {

      view.select(selection.value);
      view.flyTo(selection.value, {
        duration: 1.5,
        offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-50), 800)
      });
    },
    exit: (selection, view) => {
      view.select(null);
    }
  },
  [Selection.SELECTION_STOP_AND_ROUTE]: {
    entry: (selection, view) => {

      view.select(selection.value.stop);
      view.flyTo(selection.value.stop, {
        duration: 1.5,
        offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-50), 800)
      });
    },
    exit: (selection, view) => {
      view.select(null);
    }
  },
  [Selection.SELECTION_VEHICLE]: {
    entry: (selection, view) => {
      let trip = selection.value;

      view.track(trip);
      view.select(trip);
      view.showShape(trip.shape, true);
    },
    exit: (selection, view) => {
      let trip = selection.value;

      view.track(null);
      view.select(null);
      view.showShape(trip.shape, false);
    }
  },
  [Selection.SELECTION_EMPTY] : {
    entry : () => {},
    exit: () => {}
  }
};

export default function updateCesiumSelection(previousSelection,
                                              currentSelection,
                                              view) {
  selectionActions[previousSelection.type].exit(previousSelection, view);
  selectionActions[currentSelection.type].entry(currentSelection, view);
}

