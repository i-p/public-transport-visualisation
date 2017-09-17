import Cesium from "cesium"

const rotationScratch = new Cesium.Matrix3();

export class VehicleState {
  constructor() {
    // eslint-disable-next-line limit-cesium-allocations
    this.position = new Cesium.Cartesian3();
    // eslint-disable-next-line limit-cesium-allocations
    this.orientation = new Cesium.Cartesian3();
  }
  getQuaternion(result) {
    Cesium.Transforms.rotationMatrixFromPositionVelocity(
      this.position, this.orientation, Cesium.Ellipsoid.WGS84, rotationScratch);
    return Cesium.Quaternion.fromRotationMatrix(rotationScratch, result);
  }
}
