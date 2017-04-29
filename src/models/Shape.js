import * as OsmElement from "./OsmElement";
import Cesium from 'cesium';

export class Shape {
  constructor({id, osmRelationId, normalize, route}) {
    this.id = id;
    this.osmRelationId = osmRelationId;
    this.points = [];
    //TODO no write usage
    this.pointByName = {};
    this.normalize = normalize;
    this.route = route;
  }

  _getPointByStopName(stopName, from, to, step, getStopById) {
    const normalizedName = this.normalize(stopName);

    //TODO verify loop bounds

    // assuming that points are correctly numbered by sequence property
    for (let i = from; i != (to + step); i += step) {
      const point = this.points[i];

      if (point.stopId !== 0) {
        const normalizedStopName = this.normalize(getStopById(point.stopId).name);

        if (normalizedName === normalizedStopName) {
          return point;
        }
      }
    }
  }

  getPositionsBetweenStops(fromStop, toStop) {
    const from = this.points.findIndex(p => p.osmNodeId === fromStop.osmNodeId);
    const to = this.points.findIndex(p => p.osmNodeId === toStop.osmNodeId);

    if (from < 0) throw new Error(`Stop id ${fromStop.id} was not found in shape ${this.id}`);
    if (to < 0) throw new Error(`Stop id ${to.id} was not found in shape ${this.id}`);

    return this.points.slice(from, to + 1).map(p => p.pos);
  }

  getNextPointByStopName(stopName, fromPoint = null, getStopById) {
    // sequence == index + 1
    const from = fromPoint ? fromPoint.sequence : 0;
    const to = this.points.length - 1;

    return this._getPointByStopName(stopName, from, to, +1, getStopById);
  }

  getPrevPointByStopName(stopName, fromPoint = null, getStopById) {
    // sequence == index + 1
    const from = fromPoint ? fromPoint.sequence - 2 : this.points.length - 1;
    const to = 0;

    return this._getPointByStopName(stopName, from, to, -1, getStopById);
  }

  toPositionArray() {
    return this.points.map(p => p.pos);
  }

  appendPoint(pos, osmNodeId, stopId) {
    let distance;
    if (this.points.length === 0) {
      distance = 0;
    } else {
      var prev = this.points[this.points.length - 1];
      distance = prev.distance + Cesium.Cartesian3.distance(pos, prev.pos);
    }

    // GTFS: must be non-negative integer
    let sequence = this.points.length + 1;
    let newPoint = { pos, distance, sequence, osmNodeId, stopId };
    this.points.push(newPoint);
  }

  //TODO check if distance is not greater then lastPoint - firstPoint
  getSegmentIndexByDistance(distance, firstPoint, lastPoint) {
    let toIndex = lastPoint.sequence - 1;

    for (let i = firstPoint.sequence; i <= lastPoint.sequence; i++) {
      let relativeDistance = this.points[i - 1].distance - firstPoint.distance;

      if (relativeDistance > distance) {
        toIndex = i - 1;
        break;
      }
    }

    return toIndex - 1;
  }
}
