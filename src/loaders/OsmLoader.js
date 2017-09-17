import Cesium from "cesium"
import _ from "lodash"
import * as Osm from "../models/OsmElement"
import {TransitFeed} from "../models/TransitFeed";
import {Stop} from "../models/Stop";
import {Shape} from "../models/Shape";
import {Route} from "../models/Route";

function createMissingWay(id) {
  return {id, type: "way", nodes:[], missing: true}
}

function toTypeAndIdMap(osmElements) {
  const idMap = {
    node: new Map(),
    relation: new Map(),
    way: new Map()
  };

  osmElements.forEach(el => {
    if (el && el.id) idMap[el.type].set(el.id, el);
  });

  return (id, type) => idMap[type].get(id)
}

class ShapePart {
  constructor(way) {
    this.way = way;
    this.reverse = false;
    // end is inclusive
    this.slices = [[0, this.way.nodes.length - 1]];
  }
  get endpoints() {
    //TODO check value of this.reverse
    return [this.way.nodes[0], _.last(this.way.nodes)];
  }
  includes(node) {
    return this.way.nodes.includes(node);
  }
  get firstNode() {
    return this.reverse ? _.last(this.way.nodes) : this.way.nodes[0];
  }
  get lastNode() {
    return this.reverse ? this.way.nodes[0] : _.last(this.way.nodes);
  }
  indexOf(node) {
    const len = this.way.nodes.length;
    const index = this.way.nodes.indexOf(node);

    if (index < 0) return index;

    return this.reverse ? len - index - 1 : index;
  }
  sliceFrom(nodeId) {
    let index = this.indexOf(nodeId);
    this.slices = [[index, this.way.nodes.length - 1]];
  }
  sliceTo(nodeId) {
    let index = this.indexOf(nodeId);
    this.slices = [[0, index]];
  }
  sliceFromTo(fromNodeId, toNodeId) {
    let previousNodeIndex = this.indexOf(fromNodeId);
    let nextNodeIndex     = this.indexOf(toNodeId);

    if (previousNodeIndex < nextNodeIndex) {
      this.slices = [[previousNodeIndex, nextNodeIndex]];
    } else {
      // this is intended for roundabouts
      this.slices = [[previousNodeIndex, this.way.nodes.length - 1], [0, nextNodeIndex]]
    }
  }
  getNode(index) {
    const nodes = this.way.nodes;
    const len = nodes.length;
    return this.reverse ? nodes[len - index - 1] : nodes[index];
  }
}

export default class OsmLoader {
  constructor(normalize) {
    this.transitData = new TransitFeed(normalize);
    this.normalize = normalize;
    this.warnings = [];
  }

  _addWarning(type, message) {
    this.warnings.push({type, message});
  }

  loadAll(osmElements, elementFilter = (_el) => true) {

    const getElementById = toTypeAndIdMap(osmElements);

    osmElements.forEach(n => {
      if (n.type === "node" && Number.isFinite(n.lon) && Number.isFinite(n.lat)) {
        n.pos = Cesium.Cartesian3.fromDegrees(n.lon, n.lat, n.height || 0);
      }

      if (Osm.isStopPositionNode(n) && elementFilter(n)) {
        this.addStop(n);
      }
    });

    osmElements.forEach(el => {
      if (Osm.isRouteRelation(el) && elementFilter(el)) {
        const route = this.addRoute(el);

        this.addShape(el, route, getElementById);
      }
    });
  }
  addStop(osmNode) {
    const stop = new Stop({
      stop_id: osmNode.id,
      pos: osmNode.pos,
      stop_name: osmNode.tags.name,
      osmNodeId: osmNode.id
    });
    stop.normalizedName = this.normalize(osmNode.tags.name);
    this.transitData.addStop(stop);
  }
  addShape(osmRelation, route, getElementById) {
    // stop nodes in a relation are correctly ordered
    const stopNodes = osmRelation.members.filter(Osm.isStopNodeMember);
    const ways = osmRelation.members
      .filter(Osm.isWayMember)
      .map(m => getElementById(m.ref, "way") || createMissingWay(m.ref));
    //TODO warning for uknown roles
    let shapeParts = ways.map(w => new ShapePart(w));

    shapeParts.forEach((sp, i) => {
      let [first, last] = sp.endpoints;

      if (i === 0) {
        let next = shapeParts[i + 1];

        if (next.includes(last)) {
          sp.reverse = false;
        } else if (next.includes(first)) {
          sp.reverse = true;
        } else {
          throw new Error(`Relation ${osmRelation.id} '${osmRelation.tags.name}'\n
            Cannot determine orientation of the first way ${ways[0].id}.
            One of its endpoints (${first}, ${last}) should be part of the next way ${ways[1].id}`);
        }
        return;
      }

      if (sp.way.missing) {
        throw new Error(`Way ${sp.way.id} is missing from OSM data (relation ${osmRelation.id} '${osmRelation.tags.name}'.`);
      }
      if (Osm.isRoundaboutWay(sp.way)) {
        // assuming correct orientation of the roundabout
        return;
      }

      let previous = shapeParts[i - 1];

      // TODO specify unknown orientation based on distance to previous part?
      if (Osm.isRoundaboutWay(previous.way)) {
        if (previous.includes(first)) {
          sp.reverse = false;
        } else if (previous.includes(last)) {
          sp.reverse = true;
        } else {
          this._addWarning("unknown-orientation",
                           `Cannot determine orientation of way ${sp.way.id}`);
        }
      } else {
        if (first === previous.lastNode) {
          sp.reverse = false;
        } else if (last === previous.lastNode) {
          sp.reverse = true;
        } else {
          this._addWarning("unknown-orientation", `Cannot determine orientation of way ${sp.way.id}`);
        }
      }
    });

    function indexOfFirstPartContainingNode(nodeId) {
      return shapeParts.findIndex(sp => sp.indexOf(nodeId) >= 0);
    }
    function indexOfLastPartContainingNode(nodeId) {
      return _.findLastIndex(shapeParts, sp => sp.indexOf(nodeId) >= 0);
    }

    let indexOfFirstPart = indexOfFirstPartContainingNode(stopNodes[0].ref);
    if (indexOfFirstPart < 0) {
      this._addWarning("disconnected-stop", `Relation ${osmRelation.id} '${osmRelation.tags.name}':
                    No way contains the first stop ${stopNodes[0].ref}`)
    } else {
      shapeParts = shapeParts.slice(indexOfFirstPart);

      shapeParts[0].sliceFrom(stopNodes[0].ref);
    }

    let indexOfLastPart = indexOfLastPartContainingNode(_.last(stopNodes).ref);
    if (indexOfLastPart < 0) {
      this._addWarning("disconnected-stop", `Relation ${osmRelation.id} '${osmRelation.tags.name}':
                    No way contains the last stop ${_.last(stopNodes).ref}`)
    } else {
      shapeParts = shapeParts.slice(0, indexOfLastPart + 1);

      _.last(shapeParts).sliceTo(_.last(stopNodes).ref);
    }

    //TODO assumption - no sequence of roundabouts
    shapeParts.forEach((sp,i) => {
      if (Osm.isRoundaboutWay(sp.way)) {
        const lastNode = shapeParts[i - 1].lastNode;
        const firstNode = shapeParts[i + 1].firstNode;

        if (!sp.includes(firstNode) || !sp.includes(lastNode)) {
          throw new Error(`Relation ${osmRelation.id} '${osmRelation.tags.name}':
          roundabout error way ${sp.way.id}. Previous node: ${lastNode} (way ${shapeParts[i-1].way.id}) Next node: ${firstNode} (way ${shapeParts[i+1].way.id})`)
        }
        sp.sliceFromTo(lastNode, firstNode);
      }
    });

    const path = new Shape({
      id: osmRelation.id,
      osmRelationId: osmRelation.id,
      from: osmRelation.tags.from,
      to: osmRelation.tags.to,
      normalize: this.normalize,
      route: route.id
    });

    shapeParts.forEach(sp => {
      sp.slices.forEach(([start, end]) => {
        for (let i = start; i <= end; i++) {
          const nodeId = sp.getNode(i);
          const lastPointOsmNodeId = _.last(path.osmNodeIds);

          const skipDuplicateNode = i == start && nodeId === lastPointOsmNodeId;
          if (skipDuplicateNode) continue;

          const osmNode = getElementById(nodeId, "node");
          if (osmNode) {
            path.appendPoint(osmNode.pos, osmNode.id, Osm.isStopPositionNode(osmNode) ? osmNode.id : 0, this.transitData.positions);
          }
          //TODO warning?
        }
      });
    });

    this.transitData.addShape(path);

    this.transitData.osmElements[osmRelation.id] = osmRelation;
  }
  addRoute(osmRelation) {
    const r_id = osmRelation.tags.ref;
    let route = this.transitData.getRouteById(r_id);

    if (!route) {
      route = new Route({route_id: r_id, route_short_name: r_id, osmRelationId: osmRelation.id, route_type: Osm.getTag(osmRelation, "route") });
      this.transitData.addRoute(route);
    }

    this.transitData.osmElements[osmRelation.id] = osmRelation;

    return route;
  }
}
