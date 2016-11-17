import * as OsmElement from "./OsmElement";
import Cesium from 'cesium';

export class Shape {
  constructor({id, osmRelation, normalize, route}) {
    this.id = id;
    this.osmRelation = osmRelation;
    this.points = [];
    this.pointByName = new Map();
    this.normalize = normalize;
    this.route = route;
  }

  _getPointByStopName(stopName, from, to, step) {
    const normalizedName = this.normalize(stopName);

    //TODO verify loop bounds

    // assuming that points are correctly numbered by sequence property
    for (let i = from; i != (to + step); i += step) {
      const point = this.points[i];

      if (OsmElement.isStopPositionNode(point.osmNode)) {
        const normalizedStopName = this.normalize(point.osmNode.tags.name);

        if (normalizedName === normalizedStopName) {
          return point;
        }
      }
    }
  }

  getPositionsBetweenStops(fromStop, toStop) {
    const from = this.points.findIndex(p => p.osmNode === fromStop.osmNode);
    const to = this.points.findIndex(p => p.osmNode === toStop.osmNode);

    if (from < 0) throw new Error(`Stop id ${fromStop.id} was not found in shape ${this.id}`);
    if (to < 0) throw new Error(`Stop id ${to.id} was not found in shape ${this.id}`);

    return this.points.slice(from, to + 1).map(p => p.pos);
  }

  getNextPointByStopName(stopName, fromPoint = null) {
    // sequence == index + 1
    const from = fromPoint ? fromPoint.sequence : 0;
    const to = this.points.length - 1;

    return this._getPointByStopName(stopName, from, to, +1);
  }

  getPrevPointByStopName(stopName, fromPoint = null) {
    // sequence == index + 1
    const from = fromPoint ? fromPoint.sequence - 2 : this.points.length - 1;
    const to = 0;

    return this._getPointByStopName(stopName, from, to, -1);
  }

  toPositionArray() {
    return this.points.map(p => p.pos);
  }

  appendPoint(pos, osmNode) {
    let distance;
    if (this.points.length === 0) {
      distance = 0;
    } else {
      var prev = this.points[this.points.length - 1];
      distance = prev.distance + Cesium.Cartesian3.distance(pos, prev.pos);
    }

    // GTFS: must be non-negative integer
    let sequence = this.points.length + 1;
    let newPoint = { pos, distance, sequence, osmNode };
    this.points.push(newPoint);
  }
}