export class Stop {
  constructor({stop_id, pos, stop_name, osmNode}) {
    this.id = stop_id;
    this.pos = pos;
    this.name = stop_name;
    this.osmNode = osmNode;
    this.routes = new Set();
  }
  belongsTo(route) {
    this.routes.add(route);
  }
}
