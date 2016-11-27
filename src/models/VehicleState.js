import Cesium from "cesium"

const rotationScratch = new Cesium.Matrix3();

export class VehicleState {
  constructor() {
    this.position = new Cesium.Cartesian3();
    this.orientation = new Cesium.Cartesian3();
  }
  getQuaternion(result) {
    Cesium.Transforms.rotationMatrixFromPositionVelocity(
      this.position, this.orientation, Cesium.Ellipsoid.WGS84, rotationScratch);
    return Cesium.Quaternion.fromRotationMatrix(rotationScratch, result);
  }
}
