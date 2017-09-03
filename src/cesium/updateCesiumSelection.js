import * as Selection from "../models/selectionTypes"

function selectAndFlyTo(entity, viewer, options) {
  if (entity) {
    viewer.flyTo(entity, options);
    viewer.selectedEntity = entity;
  } else {
    console.warn("No matching entity exists");
  }
}

export function displayShape(shapeId, transitData, show) {
  const entityMap = transitData.entityMap;
  const s = transitData.getShapeById(shapeId);
  const entity = entityMap.get(s);
  if (entity) {
    entity.show = show;
  }
}

export function displayFirstAndLastStop(shapeId, transitData, show) {
  const entityMap = transitData.entityMap;
  const s = transitData.getShapeById(shapeId);

  const aTrip = transitData.getRouteTripWithShape(s.route, s);

  entityMap.get(transitData.getStopById(aTrip.firstStop)).showAlways = show;
  entityMap.get(transitData.getStopById(aTrip.lastStop)).showAlways = show;
}

let selectionActions = {
  [Selection.SELECTION_ROUTE] : {
    entry: (selection, viewer) => {
      let {route, shape} = selection.value;

      displayShape(shape.id, transitData, true);
      displayFirstAndLastStop(shape.id, transitData, true);

      let entity = transitData.entityMap.get(shape);
      
      viewer.flyTo(entity, { duration: 1.5 });
    },
    exit: (selection, viewer) => {
      let {route, shape} = selection.value;

      displayShape(shape.id, transitData, false);
      displayFirstAndLastStop(shape.id, transitData, false);
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

