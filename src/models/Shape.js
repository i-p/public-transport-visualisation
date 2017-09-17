import Cesium from 'cesium';
import _ from "lodash";

export class Shape {
  constructor({id, osmRelationId, normalize, route, distances, positions, stopIds}) {
    this.id = id;
    this.osmRelationId = osmRelationId;

    this.normalize = normalize;
    this.route = route;


    this.distances = distances || [];
    this.osmNodeIds = [];
    this.positions = positions || [];
    this.stopIds = stopIds || [];

    this.positionsArray = [];
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

  toPositionArray(allPositions) {
    if (this.positionsArray.length == 0) {
      this.positionsArray = this.positions.map(i => allPositions[i]);
    }
    return this.positionsArray;
  }

  appendPoint(pos, osmNodeId, stopId, allPositions) {
    let distance;
    if (this.positions.length === 0) {
      distance = 0;
    } else {
      var prevDistance = this.distances[this.positions.length - 1];
      const prevPos = allPositions[this.positions[this.positions.length - 1]];
      distance = prevDistance + Cesium.Cartesian3.distance(pos, prevPos);
    }

    const index = _.findIndex(allPositions, p => Cesium.Cartesian3.equals(pos, p));
    if (index !== -1) {
      this.positions.push(index);

      this.positionsArray.push(allPositions[index]);
    } else {
      allPositions.push(pos);
      this.positions.push(allPositions.length - 1);
      this.positionsArray.push(allPositions[allPositions.length - 1]);
    }

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
