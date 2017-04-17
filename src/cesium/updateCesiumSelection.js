import * as Selection from "../models/selectionTypes"

function selectAndFlyTo(entity, viewer, options) {
  if (entity) {
    viewer.flyTo(entity, options);
    viewer.selectedEntity = entity;
  } else {
    console.warn("No matching entity exists");
  }
}

let selectionActions = {
  [Selection.SELECTION_ROUTE] : {
    entry: (selection, viewer) => {
      let {route, shape} = selection.value;

      shape.show = true;

      //TODO map shape -> entity
      let entity = viewer.entities.values.find(e => e.shape === shape);

      entity.show = true;

      viewer.flyTo(entity, { duration: 1.5 });
    },
    exit: (selection, viewer) => {
      let {route, shape} = selection.value;

      //TODO map shape -> entity
      let entity = viewer.entities.values.find(e => e.shape === shape);

      entity.show = false;
    }
  },
  [Selection.SELECTION_STOP]: {
    entry: (selection, viewer) => {
      //TODO map stop -> entity
      let entities = viewer.dataSources.get(0).entities.values.filter(
        e => e.transit && e.transit.stop);
      let entity = entities.find(e => e.transit.stop === selection.value);

      selectAndFlyTo(entity, viewer, {
        duration: 1.5,
        offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-50), 800)
      });
    },
    exit: (selection, viewer) => {
      viewer.selectedEntity = null;
    }
  },
  [Selection.SELECTION_STOP_AND_ROUTE]: {
    entry: (selection, viewer) => {
      //TODO map stop -> entity
      let entities = viewer.dataSources.get(0).entities.values.filter(
        e => e.transit && e.transit.stop);

      let entity = entities.find(e => e.transit.stop === selection.value.stop);

      selectAndFlyTo(entity, viewer, {
        duration: 1.5,
        offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-50), 800)
      });
    },
    exit: (selection, viewer) => {
      viewer.selectedEntity = null;
    }
  },
  [Selection.SELECTION_VEHICLE]: {
    entry: (selection, viewer) => {
      //TODO map stop -> entity
      let entities = viewer.dataSources.get(1).entities.values.filter(
        e => e.transit && e.transit.trip);
      //entities.forEach(e => e.show = (e.transit.trip === trip));
      let trip = selection.value;
      let entity = entities.find(e => e.transit.trip === trip);

      viewer.entities.values.filter(e => e.shape)
        .forEach(e => e.show = (e.shape === trip.shape));

      viewer.trackedEntity = entity;
      viewer.selectedEntity = entity;
    },
    exit: (selection, viewer) => {
      viewer.entities.values.filter(e => e.shape)
        .forEach(e => e.show = false);
      viewer.selectedEntity = null;
      viewer.trackedEntity = null;
    }
  },
  [Selection.SELECTION_EMPTY] : {
    entry : () => {},
    exit: () => {}
  }
};

export default function updateCesiumSelection(previousSelection,
                                              currentSelection,
                                              viewer) {
  selectionActions[previousSelection.type].exit(previousSelection, viewer);
  selectionActions[currentSelection.type].entry(currentSelection, viewer);
}

