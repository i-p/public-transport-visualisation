
export function getTag(osmElement, tagName) {
  if (osmElement && osmElement.tags && (tagName in osmElement.tags)) {
    return osmElement.tags[tagName];
  }
}

export function isRoundaboutWay(wayElement) {
  return getTag(wayElement, "junction") === "roundabout";
}


const STOP_NODE_ROLES = ["stop", "stop_entry_only", "stop_exit_only"];
const PLATFORM_ROLES = ["platform", "platform_entry_only", "platform_exit_only"];

export function isStopNodeMember(m) {
  return m.type === "node" && STOP_NODE_ROLES.includes(m.role);
}

export function isWayMember(m) {
  // larger platforms are represented as ways so we need to exclude them
  return m.type === "way" && !PLATFORM_ROLES.includes(m.role);
}

export function isRouteRelation(element) {
  return element && element.type === "relation"
    && getTag(element, "type") === "route"
    && getTag(element, "ref");
}

export function isStopPositionNode(element) {
  return element && element.type == "node"
    && getTag(element, "public_transport") === "stop_position";
}
