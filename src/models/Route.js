//TODO type constants for route

export class Route {

  constructor({route_id, route_short_name, route_long_name, route_type, osmRelationId}) {
    this.id = route_id;
    this.shortName = route_short_name;
    this.longName = route_long_name;
    this.type = route_type;
    this.trips = [];
    this.osmRelationId = osmRelationId;
    this.shapes = [];
  }
  getType() {
    return this.type;
  }
}
