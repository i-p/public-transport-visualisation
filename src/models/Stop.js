export class Stop {
  constructor({stop_id, pos, stop_name, osmNodeId, normalizedName}) {
    this.id = stop_id;
    this.pos = pos;
    this.name = stop_name;
    this.osmNodeId = osmNodeId;

    //TODO calculate outside
    this.routes = [];

    this.normalizedName = normalizedName;
  }
  belongsTo(route) {
    if (this.routes.indexOf(route) < 0) {
      this.routes.push(route);
    }
  }
}
