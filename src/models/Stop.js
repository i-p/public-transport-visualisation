export class Stop {
  constructor({stop_id, pos, stop_name, osmNode}) {
    this.id = stop_id;
    this.pos = pos;
    this.name = stop_name;
    this.osmNode = osmNode;

    //TODO calculate outside
    this.routes = [];
  }
  belongsTo(route) {
    this.routes.push(route);
  }
}
