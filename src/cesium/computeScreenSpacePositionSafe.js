import Cesium from "cesium"

var scratchCartesian2 = new Cesium.Cartesian2();
var scratchCartesian3 = new Cesium.Cartesian3();
var scratchComputePixelOffset = new Cesium.Cartesian2();
var scratchPixelOffset = new Cesium.Cartesian2(0.0, 0.0);

Cesium.Billboard.prototype.computeScreenSpacePositionSafe = function(scene, result) {
  var billboardCollection = this._billboardCollection;
  if (!Cesium.defined(result)) {
    // eslint-disable-next-line limit-cesium-allocations
    result = new Cesium.Cartesian2();
  }

  if (!Cesium.defined(billboardCollection)) {
    throw new Cesium.DeveloperError("Billboard must be in a collection.  Was it removed?");
  }
  if (!Cesium.defined(scene)) {
    throw new Cesium.DeveloperError("scene is required.");
  }

  // pixel offset for screenspace computation is the pixelOffset + screenspace translate
  Cesium.Cartesian2.clone(this._pixelOffset, scratchPixelOffset);
  Cesium.Cartesian2.add(scratchPixelOffset, this._translate, scratchPixelOffset);

  var modelMatrix = billboardCollection.modelMatrix;
  var actualPosition = this._getActualPosition();

  var windowCoordinates = _computeScreenSpacePosition(modelMatrix, actualPosition,
                                                      this._eyeOffset, scratchPixelOffset, scene, result);

  if (!Cesium.defined(windowCoordinates)) {
    return;
  }

  windowCoordinates.y = scene.canvas.clientHeight - windowCoordinates.y;
  return windowCoordinates;
};

function _computeScreenSpacePosition(modelMatrix, position, eyeOffset, pixelOffset, scene, result) {
  // Model to world coordinates
  var positionWorld = Cesium.Matrix4.multiplyByPoint(modelMatrix, position, scratchCartesian3);

  // World to window coordinates
  var positionWC = Cesium.SceneTransforms.wgs84WithEyeOffsetToWindowCoordinates(scene, positionWorld, eyeOffset, result);

  if (!Cesium.defined(positionWC)) {
    return;
  }

  // Apply pixel offset
  pixelOffset = Cesium.Cartesian2.clone(pixelOffset, scratchComputePixelOffset);
  pixelOffset.y = -pixelOffset.y;
  var po = Cesium.Cartesian2.multiplyByScalar(pixelOffset, scene.context.uniformState.resolutionScale, scratchCartesian2);
  positionWC.x += po.x;
  positionWC.y += po.y;

  return positionWC;
}

