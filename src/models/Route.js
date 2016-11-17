import * as OsmElement from "./OsmElement";
//TODO type constants for route

export class Route {

  constructor({route_id, route_short_name, route_long_name, route_type, osmRelation}) {
    this.id = route_id;
    this.shortName = route_short_name;
    this.longName = route_long_name;
    this.type = route_type;
    this.trips = [];
    this.osmRelation = osmRelation;
    this.shapes = [];
  }
  getType() {
    return OsmElement.getTag(this.osmRelation, "route");
  }
}
