import Cesium from "cesium"
import "./computeScreenSpacePositionSafe"

function calculateLabelRect(billboard, viewer) {
  //TODO optimize - if screenSpacePosition is undefined, than Cartesian2 is created unecessarily
  billboard.screenSpacePosition = billboard.computeScreenSpacePositionSafe(viewer.scene, billboard.screenSpacePosition);
}

function getSeparationDistance(l1, l2) {
  let dx = Math.abs(l1.screenSpacePosition.x - l2.screenSpacePosition.x);
  let dy = Math.abs(l1.screenSpacePosition.y - l2.screenSpacePosition.y);

  let sx = dx - (l1.width * l1.scale  + l2.width * l2.scale)/2;
  let sy = dy - (l1.height * l1.scale + l2.height * l2.scale)/2;

  return Math.max(sx, sy);
}

function compare(l1, l2) {

  if (l1.id.showAlways && !l2.id.showAlways) {
    return -1;
  }
  if (!l1.id.showAlways && l2.id.showAlways) {
    return 1;
  }

  let l1Visible = l1.next === VISIBLE;
  let l2Visible = l2.next === VISIBLE;

  let timeDifference = 0;

  if (l1Visible && l2Visible) {
    timeDifference = l2.lastChange - l1.lastChange;
  } else if (!l1Visible && !l2Visible) {
    timeDifference = l1.lastChange - l2.lastChange;
  } else if (l1Visible) {
    timeDifference = -1;
  } else {
    timeDifference = 1;
  }

  let l1RouteCount = Math.floor(l1.routeCount / 3);
  let l2RouteCount = Math.floor(l2.routeCount / 3);

  if (l1Visible === l2Visible) {
    if (l2RouteCount > l1RouteCount) {
      return 1;
    } else if (l2RouteCount < l1RouteCount) {
      return -1;
    }
  }

  if (timeDifference != 0) {
    return timeDifference;
  }

  if (l1.id.id > l2.id.id) {
    return 1;
  } else {
    return -1;
  }

}



function findBillboardCollection(viewer) {
  for (let i = 0; i < viewer.dataSources.length; i++) {
    var dataSource = viewer.dataSources.get(i);

    if (dataSource.name == "stops") {
      return dataSource._entityCluster._billboardCollection;
    }
  }
}

function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

let frameNum = 0;

function recalculateNextBatchOfLabels(labels, viewer) {
  const len = labels.length;
  const batchSize = Math.ceil(len / 10);
  const batchIndex = frameNum % 10;
  const isFinalBatch = (batchIndex == 9);
  const start = batchSize * batchIndex;
  const end = batchSize * (batchIndex + 1);

  for (let i = start; i < end; i++) {
    var l = labels.get(i);
    if (l)
      calculateLabelRect(l, viewer);
  }
  return isFinalBatch;
}

const VISIBLE = 1;
const HIDDEN = -1;

export default function (viewer, transitData) {
  frameNum++;

  let labels = findBillboardCollection(viewer);

  if (!labels) return;


  var len = labels.length;
  for (let i = 0; i < len; i++) {
    var l = labels.get(i);

    if (typeof l.routeCount === "undefined" && l.id.transit) {
      l.routeCount = transitData.getRouteSetForStop(l.id.transit.stop).size;
      l.alpha = 0;
      l.next = HIDDEN;
      l.lastChange = 0;
    }
    l.alpha = clamp(l.alpha + ((l.next == VISIBLE) ? 0.1 : -0.1), 0.0, 1.0);

    l.show = l.alpha > 0;
    l.color = Cesium.Color.fromAlpha(l.color, l.alpha);
  }

  let wasFinalBatch = recalculateNextBatchOfLabels(labels, viewer);
  if (!wasFinalBatch)
    return;

  const cameraHeight = viewer.scene.camera.positionCartographic.height;

  labels._billboards.sort(compare);

  labels.get(0).next = VISIBLE;

  //TODO add to options
  let maxCameraHeight = 12000;

  if (cameraHeight > maxCameraHeight && !labels.get(0).id.showAlways) {
    labels.get(0).next = HIDDEN;
  }

  for (let i=1; i<len; i++) {
    let l1 = labels.get(i);

    if (!l1.screenSpacePosition) continue;

    if (l1.id.showAlways) {
      l1.next = VISIBLE;
      continue;
    }

    if (cameraHeight > maxCameraHeight) {
      l1.next = HIDDEN;
      continue;
    }

    if (cameraHeight > 3000 && l1.routeCount < 3) {
      l1.next = HIDDEN;
      continue;
    }

    if (l1.next === VISIBLE) {
      if (intersectsWithVisibleLabel(l1, labels, 40, 0, i)) {
        l1.next = HIDDEN;
        l1.lastChange = frameNum;
        //console.log('H', l1.id.name, l1.id.id);
      }
    } else {
      if (!intersectsWithVisibleLabel(l1, labels, 50, 0, i)) {
        l1.next = VISIBLE;
        l1.lastChange = frameNum;
        //console.log('V', l1.id.name, l1.id.id);
      }
    }
  }
}

function intersectsWithVisibleLabel(labelToTest, labels, minimalSeparation, fromIndex, toIndex) {
  for (let j=fromIndex; j<toIndex; j++) {
    let otherLabel = labels.get(j);

    if (!otherLabel.screenSpacePosition || otherLabel.next == HIDDEN) continue;

    let dist = getSeparationDistance(labelToTest, otherLabel);

    if (dist <= minimalSeparation) {
      return true;
    }
  }
  return false;
}

