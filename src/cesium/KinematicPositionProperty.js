import Cesium from "cesium"

function solveQuadratic(a,b,c, results) {
  //TODO use more precise calculation
  const d = b*b - 4*a*c;
  if (d == 0) {
    results[0] = -b/(2*a);
  } else if (d < 0) {
    results[0] = null;
    results[1] = null;
  } else {
    results[0] = (-b - Math.sqrt(d))/(2*a);
    results[1] = (-b + Math.sqrt(d))/(2*a);
  }

  return results;
}

const resultsScratch = [null, null];
const cartesian3Scratch = new Cesium.Cartesian3();
const matrix3Scratch = new Cesium.Matrix3();

function KinematicPositionProperty(startTime, endTime, shape, fromStopTime, toStopTime, referenceFrame) {
  if (shape.length < 2) throw new Error("Minimal length of positions array is 2.");

  this._definitionChanged = new Cesium.Event();
  this._startTime = startTime;
  this._endTime = endTime;


  this.firstPoint = shape.points[fromStopTime.stopSequence - 1];
  this.lastPoint = shape.points[toStopTime.stopSequence - 1];
  this.shape = shape;

  let distance = this.lastPoint.distance - this.firstPoint.distance;
  let time = Cesium.JulianDate.secondsDifference(endTime, startTime);

  let desiredAcceleration = 0.3;

  solveQuadratic(- desiredAcceleration, desiredAcceleration*time, -distance, resultsScratch);

  let accelerationDuration;

  //TODO add case for 1 result
  if (resultsScratch[0] === null) {
    desiredAcceleration = distance * 4 / (time * time);
    accelerationDuration = time / 2;
  } else {
    const s = resultsScratch[0];
    const s2 = resultsScratch[1];

    if (s > 0 && time >= 2*s) {
      accelerationDuration = s;
    } else if (s2 > 0 && time >= 2*s2) {
      accelerationDuration = s2;
    } else {
      desiredAcceleration = distance * 4 / (time * time);
    }
  }

  let velocity = desiredAcceleration * accelerationDuration;

  this._acceleration = desiredAcceleration;
  this._accelerationDuration = accelerationDuration;
  this._velocity = velocity;
  this._time = time;
  this._distance = distance;
  this._referenceFrame = Cesium.defaultValue(referenceFrame, Cesium.ReferenceFrame.FIXED);
}

Cesium.defineProperties(KinematicPositionProperty.prototype, {
  /**
   * Gets a value indicating if this property is constant.  A property is considered
   * constant if getValue always returns the same result for the current definition.
   * @memberof ConstantPositionProperty.prototype
   *
   * @type {Boolean}
   * @readonly
   */
  isConstant : {
    get : function() {
      return false;
    }
  },
  /**
   * Gets the event that is raised whenever the definition of this property changes.
   * The definition is considered to have changed if a call to getValue would return
   * a different result for the same time.
   * @memberof ConstantPositionProperty.prototype
   *
   * @type {Event}
   * @readonly
   */
  definitionChanged : {
    get : function() {
      return this._definitionChanged;
    }
  },
  /**
   * Gets the reference frame in which the position is defined.
   * @memberof ConstantPositionProperty.prototype
   * @type {ReferenceFrame}
   * @default ReferenceFrame.FIXED;
   */
  referenceFrame : {
    get : function() {
      return this._referenceFrame;
    }
  }
});

/**
 * Gets the value of the property at the provided time in the fixed frame.
 *
 * @param {JulianDate} time The time for which to retrieve the value.
 * @param {Object} [result] The object to store the value into, if omitted, a new instance is created and returned.
 * @returns {Object} The modified result parameter or a new instance if the result parameter was not supplied.
 */
KinematicPositionProperty.prototype.getValue = function(time, result) {
  return this.getValueInReferenceFrame(time, Cesium.ReferenceFrame.FIXED, result);
};

/**
 * Sets the value of the property.
 *
 * @param {Cartesian3} value The property value.
 * @param {ReferenceFrame} [referenceFrame=this.referenceFrame] The reference frame in which the position is defined.
 */
KinematicPositionProperty.prototype.setValue = function(value, referenceFrame) {
  var definitionChanged = false;
  if (!Cesium.Cartesian3.equals(this._value, value)) {
    definitionChanged = true;
    this._value = Cesium.Cartesian3.clone(value);
  }
  if (Cesium.defined(referenceFrame) && this._referenceFrame !== referenceFrame) {
    definitionChanged = true;
    this._referenceFrame = referenceFrame;
  }
  if (definitionChanged) {
    this._definitionChanged.raiseEvent(this);
  }
};

/**
 * Gets the value of the property at the provided time and in the provided reference frame.
 *
 * @param {JulianDate} time The time for which to retrieve the value.
 * @param {ReferenceFrame} referenceFrame The desired referenceFrame of the result.
 * @param {Cartesian3} [result] The object to store the value into, if omitted, a new instance is created and returned.
 * @returns {Cartesian3} The modified result parameter or a new instance if the result parameter was not supplied.
 */
KinematicPositionProperty.prototype.getValueInReferenceFrame = function(time, referenceFrame, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!Cesium.defined(time)) {
    throw new Cesium.DeveloperError("time is required.");
  }
  if (!Cesium.defined(referenceFrame)) {
    throw new Cesium.DeveloperError("referenceFrame is required.");
  }
  //>>includeEnd('debug');

  if (Cesium.JulianDate.lessThan(time, this._startTime)) return undefined;
  if (Cesium.JulianDate.greaterThan(time, this._endTime)) return undefined;

  let secondsFromStart = Cesium.JulianDate.secondsDifference(time, this._startTime);

  let distance = 0;

  let a = this._acceleration;
  let t_a = this._accelerationDuration;
  let v = this._velocity;

  if (secondsFromStart < t_a) {
    distance = 0.5 * a * secondsFromStart * secondsFromStart;
  } else if (secondsFromStart < this._time - this._accelerationDuration) {
    secondsFromStart -= t_a;

    distance = 0.5 * a * t_a * t_a
      + v * secondsFromStart;
  } else {
    secondsFromStart -= this._time - t_a;
    distance = 0.5 * a * t_a * t_a
      + v * (this._time - 2*t_a)
      + v * secondsFromStart
      - 0.5 * a * secondsFromStart * secondsFromStart;
  }

  // TODO this should be method of the Shape class
  let toIndex = this.lastPoint.sequence - 1;

  for (let i = this.firstPoint.sequence; i<=this.lastPoint.sequence; i++) {
    let relativeDistance = this.shape.points[i - 1].distance - this.firstPoint.distance;

    if (relativeDistance > distance) {
      toIndex = i - 1;
      break;
    }
  }

  let fromIndex = toIndex - 1;

  let pFrom = this.shape.points[fromIndex];
  let pTo = this.shape.points[toIndex];

  let t = ((distance + this.firstPoint.distance) - pFrom.distance) / (pTo.distance - pFrom.distance);

  if (t < 0) throw new Error("Assertion error");

  //TODO add to options
  const L = 10;
  this.shape.simulator.interpolate(fromIndex, t);
  var position = this.shape.simulator.positionAlongVehicle(- L / 2, cartesian3Scratch);

  return Cesium.PositionProperty.convertToReferenceFrame(time, position, this._referenceFrame, referenceFrame, result);


  // Simple interpolation
  //let value = Cesium.Cartesian3.lerp(pFrom.pos, pTo.pos, t, cartesian3Scratch);
  //return Cesium.PositionProperty.convertToReferenceFrame(time, value, this._referenceFrame, referenceFrame, result);
};



KinematicPositionProperty.prototype.getOrientation = function(result) {
  Cesium.Transforms.rotationMatrixFromPositionVelocity(
    this.shape.simulator.position,
    this.shape.simulator.orientation, Cesium.Ellipsoid.WGS84, matrix3Scratch);
  return Cesium.Quaternion.fromRotationMatrix(matrix3Scratch, result);
};

/**
 * Compares this property to the provided property and returns
 * <code>true</code> if they are equal, <code>false</code> otherwise.
 *
 * @param {Property} [other] The other property.
 * @returns {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
 */
KinematicPositionProperty.prototype.equals = function(other) {
  return this === other ||
    (other instanceof KinematicPositionProperty &&
    Cesium.Cartesian3.equals(this._value, other._value) &&
    this._referenceFrame === other._referenceFrame);
};

export default KinematicPositionProperty;


