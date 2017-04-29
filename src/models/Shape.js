import * as OsmElement from "./OsmElement";
import Cesium from 'cesium';

export class Shape {
  constructor({id, osmRelationId, normalize, route}) {
    this.id = id;
    this.osmRelationId = osmRelationId;

    //TODO no write usage
    this.pointByName = {};
    this.normalize = normalize;
    this.route = route;


    this.distances = [];
    this.osmNodeIds = [];
    this.positions = [];
    this.stopIds = [];
  }

  _getPointIndexByStopName(stopName, from, to, step, getStopById) {
    const normalizedName = this.normalize(stopName);

    //TODO verify loop bounds

    // assuming that points are correctly numbered by sequence property
    for (let i = from; i != (to + step); i += step) {
      const stopId = this.stopIds[i];

      if (stopId > 0) {
        const normalizedStopName = this.normalize(getStopById(stopId).name);

        if (normalizedName === normalizedStopName) {
          return i;
        }
      }
    }

    return -1;
  }

  //TODO unused
  getPositionsBetweenStops(fromStop, toStop) {
    const from = this.points.findIndex(p => p.osmNodeId === fromStop.osmNodeId);
    const to = this.points.findIndex(p => p.osmNodeId === toStop.osmNodeId);

    if (from < 0) throw new Error(`Stop id ${fromStop.id} was not found in shape ${this.id}`);
    if (to < 0) throw new Error(`Stop id ${to.id} was not found in shape ${this.id}`);

    return this.points.slice(from, to + 1).map(p => p.pos);
  }

  getNextPointByStopName(stopName, fromPointIndex = -1, getStopById) {
    const from = fromPointIndex >= 0  ? fromPointIndex + 1 : 0;
    const to = this.positions.length - 1;

    return this._getPointIndexByStopName(stopName, from, to, +1, getStopById);
  }

  getPrevPointByStopName(stopName, fromPointIndex = -1, getStopById) {
    const from = fromPointIndex >= 0 ? fromPointIndex - 1 : this.positions.length - 1;
    const to = 0;

    return this._getPointIndexByStopName(stopName, from, to, -1, getStopById);
  }

  toPositionArray() {
    return this.positions;
  }

  appendPoint(pos, osmNodeId, stopId) {
    let distance;
    if (this.positions.length === 0) {
      distance = 0;
    } else {
      var prevDistance = this.distances[this.positions.length - 1];
      const prevPos = this.positions[this.positions.length - 1];
      distance = prevDistance + Cesium.Cartesian3.distance(pos, prevPos);
    }

    this.positions.push(pos);
    this.distances.push(distance);
    this.osmNodeIds.push(osmNodeId);
    this.stopIds.push(stopId);
  }

  //TODO check if distance is not greater then lastPoint - firstPoint
  getSegmentIndexByDistance(distance, firstPointIndex, lastPointIndex) {
    let toIndex = lastPointIndex;

    for (let i = firstPointIndex; i <= lastPointIndex; i++) {
      let relativeDistance = this.distances[i] - this.distances[firstPointIndex];

      if (relativeDistance > distance) {
        toIndex = i;
        break;
      }
    }

    return toIndex - 1;
  }
}
