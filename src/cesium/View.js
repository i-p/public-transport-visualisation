


export default class View {
  constructor(viewer, transitData) {
    this._viewer = viewer;
    this._transitData = transitData;
    this._entityMap = new WeakMap();
  }

  registerEntity(object, entity) {
    this._entityMap.set(object, entity);
  }

  showShape(shapeId, show) {
    const s = this._transitData.getShapeById(shapeId);
    const entity = this._entityMap.get(s);
    if (entity) {
      entity.show = show;
    }
  }

  showFirstAndLastStop(shapeId, show) {
    const transitData = this._transitData;
    const entityMap = this._entityMap;
    const s = transitData.getShapeById(shapeId);

    const aTrip = transitData.getRouteTripWithShape(s.route, s);

    entityMap.get(transitData.getStopById(aTrip.firstStop)).showAlways = show;
    entityMap.get(transitData.getStopById(aTrip.lastStop)).showAlways = show;
  }

  flyTo(object, options) {
    const entity = this._entityMap.get(object);
    this._viewer.flyTo(entity, options);
  }

  select(object) {
    const entity = object == null ? null : this._entityMap.get(object);

    this._viewer.selectedEntity = entity;
  }

  track(trip) {
    const entity = trip == null ? null : this._entityMap.get(trip);

    this._viewer.trackedEntity = entity;
  }

  highlightStop(stop, highlight) {
    const entity = this._entityMap.get(stop);
    if (entity) {
      if (highlight) {
        entity.point.outlineWidth = 8;
        entity.point.pixelSize = 12;
      } else {
        entity.point.pixelSize = 3;
        entity.point.outlineWidth = 2;
      }
    }
  }

  highlightRoute(route, highlight) {
    route.shapes.forEach((s, i) => {
      this.showShape(s, highlight);

      // Labels for both directions would be overlapping,
      // so highlight stops for one direction only.
      if (i === 0) {
        this.showFirstAndLastStop(s, highlight);
      }
    });
  }
}
